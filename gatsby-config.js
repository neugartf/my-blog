module.exports = {
  siteMetadata: {
    title: `Hellow.`,
    author: {
      name: `Fabian Neugart`,
      summary: `who lives and works in Barcelona.`,
    },
    description: ``,
    siteUrl: `https://neugartf.netlify.app/`,
    social: {
      twitter: `_ngt__`,
    },
  },
  plugins: [{
    resolve: `gatsby-plugin-goatcounter`,
     options: {
       code: 'neugartf',
       referrer: true,
       allowLocal: false,
     }
   },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content`,
        name: 'content',
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
           "@weknow/gatsby-remark-twitter",
          {
              resolve: 'gatsby-remark-emojis',
              options: {
                // Deactivate the plugin globally (default: true)
                active : true,
                // Add a custom css class
                class  : 'emoji-icon',
                size   : 64,
                // Add custom styles
                styles : {
                  display      : 'inline',
                  margin       : '0',
                  width        : '20px',
                  position     : 'relative',
                  top          : '3px'
                }
              }
            },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        //trackingId: `ADD YOUR TRACKING ID HERE`,
      },
    },
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Gatsby Starter Blog`,
        short_name: `GatsbyJS`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `content/assets/favicon.png`,
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    `gatsby-plugin-netlify-cms`
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
