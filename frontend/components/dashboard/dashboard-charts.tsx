"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Activity Sparkline
export function ActivitySparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) {
    // Fallback visually pleasing dummy data if nothing exists yet
    data = [
      { date: "Mon", count: 4 },
      { date: "Tue", count: 8 },
      { date: "Wed", count: 3 },
      { date: "Thu", count: 7 },
      { date: "Fri", count: 5 },
      { date: "Sat", count: 9 },
      { date: "Sun", count: 12 },
    ];
  }

  // Generate dynamic horizontal gradient stops for each segment
  const stops = [];
  const totalSegments = data.length - 1;
  
  for (let i = 0; i < totalSegments; i++) {
    const isUp = data[i + 1].count >= data[i].count;
    const color = isUp ? "#00E59B" : "#FF2A5F"; // Neon Mint Green / Neon Pink-Red
    const startPct = (i / totalSegments) * 100;
    const endPct = ((i + 1) / totalSegments) * 100;
    
    stops.push(
      <stop key={`start-${i}`} offset={`${startPct}%`} stopColor={color} stopOpacity={1} />,
      <stop key={`end-${i}`} offset={`${endPct}%`} stopColor={color} stopOpacity={1} />
    );
  }

  return (
    <div className="h-[120px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="1" y2="0">
              {stops}
            </linearGradient>
            <linearGradient id="fadeMaskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity={0.5} />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </linearGradient>
            <mask id="fadeMask">
              <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeMaskGrad)" />
            </mask>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(4,16,49,0.1)", fontSize: "12px", backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)" }}
            itemStyle={{ color: "#041031", fontWeight: "bold" }}
          />
          {/* Render the fading area */}
          <Area
            type="natural"
            dataKey="count"
            stroke="none"
            fill="url(#splitColor)"
            fillOpacity={1}
            style={{ mask: "url(#fadeMask)", WebkitMask: "url(#fadeMask)" }}
            animationDuration={1500}
          />
          {/* Render the sharp glowing line on top */}
          <Area
            type="natural"
            dataKey="count"
            stroke="url(#splitColor)"
            strokeWidth={3}
            fill="none"
            filter="url(#glow)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Live Progress Ring
export function LiveProgressRing({ active, queued }: { active: number; queued: number }) {
  const total = Math.max(active + queued, 1); // Avoid div by 0
  
  const data = [
    { name: "Running", value: active },
    { name: "Queued", value: queued },
    { name: "Empty", value: total === 1 && active === 0 && queued === 0 ? 1 : 0 }
  ];

  const COLORS = ["#041031", "#99a7cc", "#f5f6f8"];

  return (
    <div className="h-[140px] w-full relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={60}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-foreground font-elsie">{active}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active</span>
      </div>
    </div>
  );
}

// Animated Card Wrapper
export function AnimatedCard({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`rounded-lg border border-border/80 bg-white shadow-sm hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
