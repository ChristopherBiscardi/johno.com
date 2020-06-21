/** @jsx jsx */
import React from 'react'
import { transform } from '@babel/standalone'
import mdx from '@mdx-js/mdx'
import { ThemeProvider, Styled, jsx } from 'theme-ui'
import { DesignSystemProvider } from 'johno-ds'
import { mdx as createElement, MDXProvider } from '@mdx-js/react'
import babelPluginTransformReactJsx from '@babel/plugin-transform-react-jsx'
import babelPluginRemoveExportKeywords from 'babel-plugin-remove-export-keywords'

import babelPluginRemoveShortcodes from '../babel-plugins/remove-shortcodes'

import * as buitinComponents from './builtins'

const transformJsx = (jsx) => {
  const { code } = transform(jsx, {
    plugins: [
      babelPluginRemoveExportKeywords,
      babelPluginRemoveShortcodes,
      [babelPluginTransformReactJsx, { useBuiltIns: true }]
    ]
  })

  return code
}

const transformCodeForEval = (jsx) => {
  return `${jsx}
  return React.createElement(MDXProvider, { components },
    React.createElement(MDXContent, props)
  );`
}

const Renderer = ({
  children: mdxSrc,
  scope = {},
  components = {},
  theme = {},
  ...props
}) => {
  const fullScope = {
    ...buitinComponents,
    mdx: createElement,
    MDXProvider,
    React,
    components: { ...Styled, ...components },
    props,
    theme,
    ...scope
  }
  const scopeKeys = Object.keys(fullScope)
  const scopeValues = Object.values(fullScope)

  try {
    const jsxFromMdx = mdx.sync(mdxSrc, { skipExport: true })
    const srcCode = transformJsx(jsxFromMdx)

    const fn = new Function(...scopeKeys, transformCodeForEval(srcCode))
    const el = fn(...scopeValues)

    return (
      <ThemeProvider theme={theme}>
        <main
          sx={{
            bg: 'background',
            fontFamily: 'body',
            color: 'text',
            px: [2, 3, 4],
            py: [3, 4, 5]
          }}
        >
          {el}
        </main>
      </ThemeProvider>
    )
  } catch (e) {
    return (
      <div>
        <h1>⛔️ Invalid MDX</h1>
        <pre>{JSON.stringify(e, null, 2)}</pre>
        <pre>{JSON.stringify(e.stack, null, 2)}</pre>
      </div>
    )
  }
}

export default (props) => <Renderer {...props} />
