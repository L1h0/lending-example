import { initHeaderScroll } from './header-scroll.js';
import { initClientRibbon } from './client-ribbon.js';
import { initMenu } from './modules/menu.js';
import { initInquiryForm } from './modules/inquiry.js';
import { initRecommendations } from './modules/recommendations.js';

const closeMenu = initMenu();
initHeaderScroll(closeMenu);
initClientRibbon();
const inquiry = initInquiryForm();
if (inquiry) initRecommendations(inquiry.chooseService);
