/* WAR GUILD II · boot */
(() => {
  'use strict';
  const boot = () => {
    if (!window.WG?.Game) return;
    window.game = new window.WG.Game();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
