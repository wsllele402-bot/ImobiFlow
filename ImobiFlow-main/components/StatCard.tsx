
import React from 'react';

import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-5 md:p-8 rounded-[28px] relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500`} />
      
      <div className="flex items-center justify-between mb-6">
        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl ${color}/10 flex items-center justify-center text-lg md:text-2xl border border-gray-200 dark:border-white/5`}>
          <i className={`fas ${icon} ${color.replace('bg-', 'text-')}`}></i>
        </div>
        {trend && (
          <span className="text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-[9px] md:text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{value}</h3>
      </div>
    </motion.div>
  );
};

export default StatCard;