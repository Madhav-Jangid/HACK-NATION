"""Technical Partner signal: an actual code-style review of a founder's most
representative public GitHub repo, not just their profile bio.

The research pipeline already fetches the founder's GitHub *profile page* via
Tavily (bio text, pinned-repo links as prose) -- useful, but not the same as
looking at how they actually write code. This module hits the GitHub REST API
directly to find their most-starred public repo (falling back to their most
recently pushed one if nothing has stars yet), then pulls its language
breakdown, README, a real source-file sample, and recent commit messages --
the same things a technical partner would actually look at.
"""

import base64
import logging
from urllib.parse import urlparse

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_API = "https://api.github.com"
_TIMEOUT = 10.0

_SOURCE_EXTENSIONS = (
    ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".java", ".rb", ".c",
    ".cpp", ".cc", ".cs", ".php", ".kt", ".swift", ".scala", ".m",
)

_COMMON_SOURCE_DIRS = ("src", "app", "lib", "pkg", "internal")


class GitHubNotFound(RuntimeError):
    """The founder's GitHub URL doesn't resolve to a reviewable user/repo."""


def _headers() -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _username_from_url(github_url: str) -> str:
    path = urlparse(github_url).path.strip("/")
    if not path:
        raise GitHubNotFound(f"Couldn't parse a GitHub username from {github_url!r}.")
    return path.split("/")[0]


def _get(client: httpx.Client, path: str) -> httpx.Response | None:
    try:
        resp = client.get(f"{_API}{path}", headers=_headers(), timeout=_TIMEOUT)
    except httpx.HTTPError as e:
        logger.warning("GitHub API request failed (%s): %s", path, e)
        return None
    if resp.status_code == 404:
        return None
    if resp.status_code == 403:
        logger.warning("GitHub API rate-limited or forbidden for %s", path)
        return None
    if resp.status_code >= 400:
        logger.warning("GitHub API returned %s for %s", resp.status_code, path)
        return None
    return resp


def _fetch_user_profile(client: httpx.Client, username: str) -> dict | None:
    """None means the username itself doesn't resolve to a GitHub user at all
    (distinct from "user exists but has no public repos") -- callers use this
    to distinguish a bad/stale URL from a founder who just hasn't published
    anything yet, and to grab the avatar for the persona card regardless of
    whether there's any code to review.
    """
    resp = _get(client, f"/users/{username}")
    return resp.json() if resp is not None else None


def _pick_best_repo(client: httpx.Client, username: str) -> dict | None:
    """Most-starred public, non-fork repo; falls back to most recently pushed
    if the founder has repos but none have any stars yet (very common for a
    cold-start founder -- their code should still be reviewable). Returns None
    if they simply have no public repos (caller already confirmed the user
    itself exists via `_fetch_user_profile`).
    """
    resp = _get(client, f"/users/{username}/repos?per_page=100&sort=pushed")
    if resp is None:
        return None

    repos = resp.json()
    if not repos:
        return None

    non_forks = [r for r in repos if not r.get("fork")]
    pool = non_forks or repos
    return max(pool, key=lambda r: (r.get("stargazers_count", 0), r.get("pushed_at") or ""))


def _language_summary(client: httpx.Client, full_name: str) -> str:
    resp = _get(client, f"/repos/{full_name}/languages")
    if resp is None:
        return "unknown"
    languages = resp.json()
    if not languages:
        return "unknown"
    ranked = sorted(languages.items(), key=lambda kv: kv[1], reverse=True)
    return ", ".join(name for name, _ in ranked[:3])


def _fetch_readme(client: httpx.Client, full_name: str) -> str | None:
    """Full decoded README text, uncapped -- callers slice it for whatever
    they need (a short excerpt for the code-review summary, the full text for
    a dedicated README memory item the UI can render).
    """
    resp = _get(client, f"/repos/{full_name}/readme")
    if resp is None:
        return None
    data = resp.json()
    content = data.get("content")
    if not content:
        return None
    try:
        decoded = base64.b64decode(content).decode("utf-8", errors="ignore")
    except (ValueError, TypeError):
        return None
    return decoded.strip() or None


def _list_dir(client: httpx.Client, full_name: str, path: str = "") -> list[dict]:
    resp = _get(client, f"/repos/{full_name}/contents/{path}")
    if resp is None:
        return []
    data = resp.json()
    return data if isinstance(data, list) else []


def _find_sample_file(client: httpx.Client, full_name: str) -> dict | None:
    """A real source file to show the model, not just metadata -- picks the
    largest recognizable source file at the repo root, or one directory into
    a conventional source folder (src/app/lib/pkg/internal) if the root is
    all docs/config, so this works for both flat scripts and structured apps.
    """

    def _best_of(entries: list[dict]) -> dict | None:
        candidates = [
            e for e in entries
            if e.get("type") == "file" and e["name"].lower().endswith(_SOURCE_EXTENSIONS)
        ]
        return max(candidates, key=lambda e: e.get("size", 0)) if candidates else None

    root = _list_dir(client, full_name)
    best = _best_of(root)
    if best:
        return best

    for dirname in _COMMON_SOURCE_DIRS:
        match = next((e for e in root if e.get("type") == "dir" and e["name"].lower() == dirname), None)
        if not match:
            continue
        best = _best_of(_list_dir(client, full_name, match["path"]))
        if best:
            return best
    return None


def _code_sample(client: httpx.Client, full_name: str) -> tuple[str, str] | None:
    file_entry = _find_sample_file(client, full_name)
    if file_entry is None:
        return None
    resp = _get(client, f"/repos/{full_name}/contents/{file_entry['path']}")
    if resp is None:
        return None
    data = resp.json()
    content = data.get("content")
    if not content:
        return None
    try:
        decoded = base64.b64decode(content).decode("utf-8", errors="ignore")
    except (ValueError, TypeError):
        return None
    return file_entry["path"], decoded[:1500]


def _recent_commit_messages(client: httpx.Client, full_name: str) -> list[str]:
    resp = _get(client, f"/repos/{full_name}/commits?per_page=5")
    if resp is None:
        return []
    commits = resp.json()
    messages = []
    for c in commits:
        message = ((c.get("commit") or {}).get("message") or "").splitlines()
        if message:
            messages.append(message[0][:120])
    return messages


def review_github_code(github_url: str) -> dict:
    """Returns a dict describing this founder's GitHub presence: always an
    avatar_url/bio if the user exists, plus (when they have a public repo) a
    code-style review -- language breakdown, README, a real source-file
    sample, and recent commit messages. `has_repo` is False when the user
    exists but has published nothing reviewable (common for a cold-start
    founder) -- the avatar/bio are still worth keeping for the persona card
    even then. Raises `GitHubNotFound` only if the username itself doesn't
    resolve to a real GitHub user at all.
    """
    username = _username_from_url(github_url)

    with httpx.Client() as client:
        profile = _fetch_user_profile(client, username)
        if profile is None:
            raise GitHubNotFound(f"GitHub user {username!r} not found.")

        result = {
            "avatar_url": profile.get("avatar_url"),
            "bio": profile.get("bio"),
            # Founder Partner cross-referencing: GitHub's own "company"/"blog"/
            # "twitter_username" profile fields are a free, direct way to
            # backfill the founder's company name, company website, and
            # Twitter handle when the founder record doesn't have them yet.
            "real_name": profile.get("name"),
            "company": (profile.get("company") or "").lstrip("@").strip() or None,
            "blog": profile.get("blog") or None,
            "twitter_username": profile.get("twitter_username"),
            "location": profile.get("location"),
            "has_repo": False,
            "title": f"GitHub profile: {username}",
            "snippet": "No public repos to review yet.",
            "repo_url": profile.get("html_url", f"https://github.com/{username}"),
            "repo_full_name": None,
            "stars": 0,
            "language_summary": "none",
            "readme_full": None,
        }

        repo = _pick_best_repo(client, username)
        if repo is None:
            return result

        full_name = repo["full_name"]
        languages = _language_summary(client, full_name)
        readme = _fetch_readme(client, full_name)
        sample = _code_sample(client, full_name)
        commits = _recent_commit_messages(client, full_name)

    lines = [
        f"Repo: {full_name} ({repo.get('stargazers_count', 0)}★, "
        f"{repo.get('forks_count', 0)} forks, last pushed {repo.get('pushed_at', 'unknown')}).",
        f"Primary language(s): {languages}.",
    ]
    if repo.get("description"):
        lines.append(f"Repo description: {repo['description']}")
    if readme:
        lines.append(f"README excerpt: {readme[:600]}")
    if commits:
        lines.append("Recent commit messages: " + " | ".join(commits))
    if sample:
        path, snippet = sample
        lines.append(f"Code sample from {path}:\n{snippet}")
    else:
        lines.append("No reviewable source file found in this repo (docs/config only).")

    result.update(
        {
            "has_repo": True,
            "title": f"Code style review: {full_name} ({repo.get('stargazers_count', 0)}★)",
            "snippet": "\n".join(lines)[:3000],
            "repo_url": repo.get("html_url", f"https://github.com/{full_name}"),
            "repo_full_name": full_name,
            "stars": repo.get("stargazers_count", 0),
            "language_summary": languages,
            "readme_full": (readme or "")[:4000] or None,
        }
    )
    return result
