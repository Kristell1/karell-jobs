import "./globals.css";

export const metadata = {
  title: "Studio Candidature — Karell",
  description: "Outil IA de recherche d'emploi UX, génération de titres CV et rédaction de candidatures",
  openGraph: {
    title: "Studio Candidature",
    description: "Recherche d'offres UX, optimisation CV, candidatures personnalisées",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
