// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config



import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'At0m',
  tagline: 'I just exist.',
  favicon: 'img/0_medium.png',

  // Set the production url of your site here
  url: 'https://at0m.tech/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'At0m', // Usually your GitHub org/user name.
  projectName: 'At0m', // Usually your repo name.

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'ignore',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          breadcrumbs: false,
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: {
          blogTitle: 'At0m',
          blogDescription: 'Yapping here.',
          postsPerPage: 10,
          routeBasePath: '/', // Serves blog at the site root
          showReadingTime: true,
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'At0m',
        logo: {
          alt: 'My Site Logo',
          src: 'img/0_medium.png',
        },

        items: [
          {
            type: 'dropdown',
            label: 'CTF accounts',
            position: 'right',
            items: [
              {
                label: 'CTFtime',
                href: 'https://app.hackthebox.com/users/2109485',
              },
              {
                label: 'Hack The Box',
                href: 'https://app.hackthebox.com/profile/2109485',
              },
              
            ],
          },

          {
            type: 'dropdown',
            label: 'Friends',
            position: 'right',
            items: [
              {
                label: '0x0w1z',
                href: 'https://0x0w1z.tech/',
              },
              {
                label: 'Rhythm',
                href: 'https://rhythmkafle.github.io/',
              },
              {
                label: 'p0u',
                href: 'https://nidanpoudel.com.np/',
              },
            ],
          },

          {
            type: 'dropdown',
            label: 'Socials',
            position: 'right',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/At0mXploit',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/in/Rijan-Poudel/',
              }, 
              {
                label: 'Twitter/X',
                href: 'https://x.com/At0mXploit',
              }, 	
            ],
          },

          {
            type: 'dropdown',
            label: 'Contact',
            position: 'right',
            items: [
              {
                label: 'Email',
                href: 'mailto:automaticat0m.conf@gmail.com',
              },
              {
                label: 'Discord',
                href: 'https://discord.app/#/@At0mXploit',
              },
            ],
          }, 
        ],
      },
      prism: {
        theme: prismThemes.oneDark,
      },
      algolia: {
          // The application ID provided by Algolia
        appId: 'XUM92KL2IK',
          // Public API key: it is safe to commit it
        apiKey: '7ed7f707a437c68890cd68c2f51b0949',
        indexName: 'writeups-kunull',
        // contextualSearch: false,
        typoTolerance: false,
        maxResultsPerGroup: 9999,
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 5,
      },
    }),
  
};

export default config;
