'use client';

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Order } from '@/types';
import { buildWhatsAppConfirmationLink } from '@/lib/whatsapp';

export function WhatsAppButton({ order }: { order: Order }) {
  const link = buildWhatsAppConfirmationLink(order);

  return (
    <motion.a
      whileTap={{ scale: 0.96 }}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      animate={{ boxShadow: ['0 0 0 0 rgba(37,211,102,0.4)', '0 0 0 12px rgba(37,211,102,0)'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-transform hover:brightness-95 active:scale-95"
    >
      <MessageCircle className="h-5 w-5" />
      تأكيد الطلب عبر واتساب
    </motion.a>
  );
}
