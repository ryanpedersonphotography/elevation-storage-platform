'use client'

import Script from 'next/script'

interface GtagScriptProps {
  gtagId: string
}

export function GtagScript({ gtagId }: GtagScriptProps) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtagId}');
        `}
      </Script>
    </>
  )
}
