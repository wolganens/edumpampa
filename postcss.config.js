const postcss = require('postcss')
module.exports = {
	plugins: [
		postcss([			
			require('postcss-high-contrast')({
				aggressiveHC: true,
				aggressiveHCDefaultSelectorList: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'th', 'td', 'a'],
				aggressiveHCCustomSelectorList: ['div', 'span', 'a'],

				backgroundColor: '#000',
				altBgColor: '#fff',

				textColor: '#fff',

				buttonSelector: ['button'],
				buttonColor: '#000',
				buttonBackgroundColor: '#fcff3c',
				buttonBorderColor: 'none',
				
				linkSelectors:  ['a'],
				linkColor: '#FFFF00 !important',
				linkHoverColor: '#fcff3c !important',
				linkBackgroundColor: '#000 !important',

				borderColor: '#008045',
				disableShadow: true,
				
				customSelectors: ['input'],
				customSelectorColor: '#fff',
				customSelectorBackgroundColor: '#000',
				customSelectorBorderdColor: '#fff',
				
				selectorsBlackList: ['textfield'],

				imageFilter: 'invert(100%)',
				imageSelectors: ['img'],

				removeCSSProps: false,
		        CSSPropsWhiteList: ['background', 'background-color', 'color', 'border', 'border-top', 'border-bottom',
		            'border-left', 'border-right', 'border-color', 'border-top-color', 'border-right-color',
		            'border-bottom-color', 'border-left-color', 'box-shadow', 'filter', 'text-shadow']
			})
		])
	]
};