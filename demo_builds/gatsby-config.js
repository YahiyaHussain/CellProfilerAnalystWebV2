module.exports = {
	siteMetadata: {
		title: 'Gatsby Test',
	},
	pathPrefix: '/CellProfilerAnalystWebV2',
	flags: {
		THE_FLAG: false,
	},
	plugins: [
		// "gatsby-plugin-styled-components",
		// "gatsby-plugin-image",
		// "gatsby-plugin-sharp",
		// "gatsby-transformer-sharp",
		{
			resolve: `gatsby-plugin-typescript`,
			options: {
			  isTSX: true, // defaults to false
			  jsxPragma: `jsx`, // defaults to "React"
			  allExtensions: true, // defaults to false
			},
		  },
		{
			resolve: 'gatsby-source-filesystem',
			options: {
				name: 'images',
				path: './src/images/',
			},
			__key: 'images',
		},
		{
			resolve: "gatsby-plugin-eslint",
			options: {
			  test: /\.js$|\.jsx$|\.ts$|\.tsx$/,
			  exclude: /(node_modules|.cache|public)/,
			  stages: ["develop"],
			  options: {
				emitWarning: true,
				failOnError: false,
			  },
			},
		  }
	],
};
