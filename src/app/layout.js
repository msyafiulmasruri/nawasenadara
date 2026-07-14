import './globals.css';

export const metadata = {
  title: 'Nawasena Dara',
  description:
    'Narrative-Driven Learning Game untuk edukasi dan pendampingan pencegahan kekerasan pada remaja putri.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Pixel fonts: Jersey 15 untuk title/logo, Pixelify Sans untuk tombol & UI pixel-style */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jersey+15&family=Pixelify+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
