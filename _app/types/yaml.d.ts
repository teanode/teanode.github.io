// @rollup/plugin-yaml turns a YAML file into a module whose default export is
// the parsed document. The translation catalogues are the only YAML imported.
declare module '*.yaml' {
  const content: Record<string, unknown>
  export default content
}
