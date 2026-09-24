"use client"

import { motion, Variants } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

gsap.registerPlugin(ScrollTrigger);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function AnimatedStatCard({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`col-span-1 md:col-span-3 bg-bg-main rounded-xl p-sp-6 flex flex-col justify-between group transition-colors ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ActivityChart({ data }: { data: { name: string; xp: number }[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring" }}
      className="col-span-1 md:col-span-12 glass-panel rounded-xl p-sp-6 mt-gutter"
    >
      <h3 className="font-headline-md text-headline-md text-text-primary mb-sp-6">Learning Activity (Last 7 Days)</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#FAFAFA' }}
              itemStyle={{ color: '#8B5CF6' }}
            />
            <Area type="monotone" dataKey="xp" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" activeDot={{ r: 8, fill: "#8B5CF6", stroke: "#FAFAFA", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export function GsapTimelineList({ tasks }: { tasks: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const cards = gsap.utils.toArray('.timeline-card');
    
    cards.forEach((card: any, i) => {
      gsap.fromTo(card, 
        { 
          opacity: 0, 
          x: 50,
          scale: 0.95
        },
        {
          opacity: 1, 
          x: 0,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: card,
            scroller: containerRef.current,
            start: "top bottom-=20",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, { scope: containerRef, dependencies: [tasks] });

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto pr-2 space-y-6 relative hide-scrollbar">
      {tasks.length > 0 ? (
        tasks.map((task, index) => (
          <div key={task.id} className="relative z-10 flex gap-sp-4 group cursor-pointer timeline-card">
            {index === 0 ? (
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${task.taskType === 'REVIEW' ? 'bg-accent-amber/20 border-accent-amber shadow-glow-sm' : 'bg-primary-gradient border-primary-container shadow-glow-primary'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${task.taskType === 'REVIEW' ? 'bg-accent-amber' : 'bg-white'}`}></div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-2 border-2 border-surface-bright flex items-center justify-center shrink-0 mt-1">
                {task.taskType === 'REVIEW' ? (
                  <span className="material-symbols-outlined text-accent-amber text-sm">history</span>
                ) : (
                  <span className="font-label-mono text-text-muted text-sm">{index + 1}</span>
                )}
              </div>
            )}
            
            <div className={`flex-1 rounded-lg p-sp-4 border transition-colors ${index === 0 ? 'bg-bg-card border-gold-primary group-hover:border-gold-primary' : 'bg-bg-card border-border-card group-hover:border-border-light'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-body-base text-body-base font-semibold text-text-primary">{task.title}</h4>
                <span className={`font-label-mono text-[10px] flex flex-col items-end gap-1 ${index === 0 ? 'text-gold-primary' : 'text-text-muted'}`}>
                  <span>{task.topic.estimatedMins} mins</span>
                  {task.scheduledAt && <span className="opacity-80">Scheduled: {new Date(task.scheduledAt).toLocaleDateString()}</span>}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-text-muted mb-3">{task.topic.module.title}</p>
              
              {index === 0 && (
                <div className="flex gap-2">
                  <Link href={`/courses/${task.topic.module.courseId}/lesson/${task.topicId}`}>
                    <button className={`px-4 py-2 rounded-lg font-label-mono text-[12px] hover:scale-105 transition-transform ${task.taskType === 'REVIEW' ? 'bg-bg-card text-gold-primary border border-gold-primary' : 'bg-gold-primary text-gold-text-dark font-medium'}`}>
                      {task.taskType === 'REVIEW' ? 'Review Lesson' : 'Start lesson'}
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500 border-2 border-dashed border-white/10 rounded-lg bg-surface-1/50">
          <CheckCircle2 className="w-12 h-12 mx-auto text-secondary mb-3" />
          <p className="font-body-base text-text-muted mb-4">You have no pending lessons!</p>
          <Link href="/courses/create">
            <button className="px-6 py-2 rounded-lg bg-surface-2 border border-white/10 hover:border-primary/50 text-text-primary font-label-mono uppercase tracking-wider transition-colors">
              Generate a new course
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
