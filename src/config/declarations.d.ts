declare module '*.png'
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.pdf' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const content: string
  export default content
}
