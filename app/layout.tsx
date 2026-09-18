import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Halal Cart — Your next great bite, around the corner.', description: 'Find NYC halal carts, check owner-shared availability, explore menus and order ahead for pickup. Your neighborhood, served fresh.', icons: { icon: '/halal-cart-logo.png', apple: '/halal-cart-logo.png' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#075d45' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
