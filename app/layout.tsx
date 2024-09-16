import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { log } from 'console';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
