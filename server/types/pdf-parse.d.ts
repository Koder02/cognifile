declare module 'pdf-parse' {
  const parse: (data: Buffer | Uint8Array) => Promise<{text: string}>;
  export default parse;
}
