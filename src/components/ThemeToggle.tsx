'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 获取点击位置用于扩散动画
    const x = e.clientX;
    const y = e.clientY;

    // 计算覆盖整个屏幕所需的半径
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // 检查浏览器是否支持 View Transitions API
    if (!document.startViewTransition) {
      toggleTheme();
      return;
    }

    // 使用 View Transitions API 创建流畅的扩散动画
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        toggleTheme();
      });
    });

    transition.ready.then(() => {
      // 扩散动画：从点击位置向外扩展的圆形
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <button
      onClick={handleClick}
      className="
        relative w-10 h-10 rounded-full flex items-center justify-center
        bg-gray-100 dark:bg-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-600
        text-gray-600 dark:text-amber-400
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
      "
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      <div className="relative w-5 h-5">
        <Sun
          size={20}
          className={`
            absolute inset-0 transform transition-all duration-500
            ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        <Moon
          size={20}
          className={`
            absolute inset-0 transform transition-all duration-500
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-0'}
          `}
        />
      </div>
    </button>
  );
}
