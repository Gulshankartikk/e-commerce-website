import React from 'react';
import * as Lu from 'react-icons/lu';

/**
 * Standardized outline icon wrapper for FLASHSHOP.
 * Guarantees consistent 1.75 stroke-width, proportional sizing, and clean SVG rendering.
 */
function wrap(Component, defaultSize = 20) {
  return function WrappedIcon({ size = defaultSize, strokeWidth = 1.75, className = '', ...props }) {
    return <Component size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...props} />;
  };
}

// Navigation
export const IconHome = wrap(Lu.LuHouse, 20);
export const IconStore = wrap(Lu.LuStore, 20);
export const IconCategories = wrap(Lu.LuLayoutGrid, 20);
export const IconAbout = wrap(Lu.LuInfo, 20);
export const IconContact = wrap(Lu.LuMail, 20);

// Header
export const IconSearch = wrap(Lu.LuSearch, 20);
export const IconUserRound = wrap(Lu.LuUserRound, 20);
export const IconHeart = wrap(Lu.LuHeart, 20);
export const IconShoppingCart = wrap(Lu.LuShoppingCart, 20);
export const IconMenu = wrap(Lu.LuMenu, 22);

// Products
export const IconPackage = wrap(Lu.LuPackage, 18);
export const IconStar = wrap(Lu.LuStar, 16);
export const IconSlidersHorizontal = wrap(Lu.LuSlidersHorizontal, 18);
export const IconArrowUpDown = wrap(Lu.LuArrowUpDown, 18);
export const IconBarChart = wrap(Lu.LuChartBar, 18);

// Product details
export const IconPlus = wrap(Lu.LuPlus, 18);
export const IconMinus = wrap(Lu.LuMinus, 18);
export const IconChevronLeft = wrap(Lu.LuChevronLeft, 20);
export const IconChevronRight = wrap(Lu.LuChevronRight, 20);
export const IconChevronDown = wrap(Lu.LuChevronDown, 18);
export const IconShare2 = wrap(Lu.LuShare2, 18);
export const IconTruck = wrap(Lu.LuTruck, 22);
export const IconShieldCheck = wrap(Lu.LuShieldCheck, 22);

// Cart & Checkout
export const IconTrash2 = wrap(Lu.LuTrash2, 18);
export const IconTag = wrap(Lu.LuTag, 18);
export const IconMapPin = wrap(Lu.LuMapPin, 20);
export const IconCreditCard = wrap(Lu.LuCreditCard, 20);
export const IconSmartphone = wrap(Lu.LuSmartphone, 20);
export const IconZap = wrap(Lu.LuZap, 20);
export const IconCheckCircle2 = wrap(Lu.LuCircleCheck, 20);

// Account & Settings
export const IconSettings = wrap(Lu.LuSettings, 18);
export const IconLogOut = wrap(Lu.LuLogOut, 18);
export const IconBell = wrap(Lu.LuBell, 20);
export const IconLock = wrap(Lu.LuLock, 18);
export const IconUserCheck = wrap(Lu.LuUserCheck, 18);

// Admin
export const IconLayoutDashboard = wrap(Lu.LuLayoutDashboard, 20);
export const IconUsers = wrap(Lu.LuUsers, 20);
export const IconChartNoAxesCombined = wrap(Lu.LuChartNoAxesCombined, 20);
export const IconLayers = wrap(Lu.LuLayers, 20);
export const IconTicket = wrap(Lu.LuTicket, 20);
export const IconImage = wrap(Lu.LuImage, 20);
export const IconDollarSign = wrap(Lu.LuDollarSign, 18);
export const IconTrendingUp = wrap(Lu.LuTrendingUp, 20);
export const IconBox = wrap(Lu.LuBox, 18);
export const IconCpu = wrap(Lu.LuCpu, 20);

// AI Shopping Assistant
export const IconMessageCircle = wrap(Lu.LuMessageCircle, 20);
export const IconSparkles = wrap(Lu.LuSparkles, 20);
export const IconSend = wrap(Lu.LuSend, 18);
export const IconBot = wrap(Lu.LuBot, 20);
export const IconThumbsUp = wrap(Lu.LuThumbsUp, 16);
export const IconThumbsDown = wrap(Lu.LuThumbsDown, 16);

// General UI
export const IconX = wrap(Lu.LuX, 20);
export const IconCheck = wrap(Lu.LuCheck, 18);
export const IconAlertCircle = wrap(Lu.LuCircleAlert, 20);
export const IconInfo = wrap(Lu.LuInfo, 18);
export const IconLoaderCircle = wrap(Lu.LuLoaderCircle, 20);
export const IconEye = wrap(Lu.LuEye, 18);
export const IconEyeOff = wrap(Lu.LuEyeOff, 18);
export const IconSlash = wrap(Lu.LuSlash, 18);
export const IconDownload = wrap(Lu.LuDownload, 18);
export const IconPhone = wrap(Lu.LuPhone, 20);
export const IconMic = wrap(Lu.LuMic, 18);
export const IconMicOff = wrap(Lu.LuMicOff, 18);
export const IconExternalLink = wrap(Lu.LuExternalLink, 16);
export const IconRefreshCw = wrap(Lu.LuRefreshCw, 18);
export const IconArrowRight = wrap(Lu.LuArrowRight, 18);
export const IconArrowLeft = wrap(Lu.LuArrowLeft, 18);
export const IconHelpCircle = wrap(Lu.LuCircleHelp, 18);
export const IconFileText = wrap(Lu.LuFileText, 18);
export const IconEdit = wrap(Lu.LuPencil, 18);
export const IconPencil = wrap(Lu.LuPencil, 18);
export const IconClock = wrap(Lu.LuClock, 18);
export const IconXCircle = wrap(Lu.LuCircleX, 20);
export const IconPlay = wrap(Lu.LuPlay, 18);
export const IconMail = wrap(Lu.LuMail, 20);
export const IconBriefcase = wrap(Lu.LuBriefcase, 18);
export const IconBookOpen = wrap(Lu.LuBookOpen, 18);

// Social Media (Outline)
export const IconFacebook = wrap(Lu.LuFacebook, 18);
export const IconTwitter = wrap(Lu.LuTwitter, 18);
export const IconInstagram = wrap(Lu.LuInstagram, 18);
export const IconLinkedin = wrap(Lu.LuLinkedin, 18);
export const IconYoutube = wrap(Lu.LuYoutube, 18);
