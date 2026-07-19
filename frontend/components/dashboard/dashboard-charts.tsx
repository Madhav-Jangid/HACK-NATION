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
      { date: "Mon", count: 2 },
      { date: "Tue", count: 5 },
      { date: "Wed", count: 3 },
      { date: "Thu", count: 8 },
      { date: "Fri", count: 4 },
      { date: "Sat", count: 7 },
      { date: "Sun", count: 12 },
    ];
  }

  return (
    <div className="h-[120px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#041031" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#041031" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(4,16,49,0.1)", fontSize: "12px" }}
            itemStyle={{ color: "#041031", fontWeight: "bold" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#041031"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCount)"
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
