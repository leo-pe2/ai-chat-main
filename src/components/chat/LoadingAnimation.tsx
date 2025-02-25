import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingAnimationProps {
  isLoading: boolean;
  speed?: number; 
}

const dotVariants = {
  animate: {
    scale: [1, 1.5, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 0.8, 
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ isLoading, speed = 1 }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="flex items-center space-x-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ marginLeft: '-15px' }} 
        >
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full" 
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, duration: 0.8 / speed }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"  
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, delay: 0.3 / speed, duration: 0.8 / speed }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full" 
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, delay: 0.6 / speed, duration: 0.8 / speed }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingAnimation;
