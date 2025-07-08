export const loadScript = (src: string, type: string = "text/javascript") => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = type;
    script.async = true;

    script.onload = () => {
      console.log(`${src} Loaded`);
      resolve(true);
    };

    script.onerror = () => {
      console.error(`${src} Failed to Load`);
      reject(false);
    };

    document.head.appendChild(script);
  });
};

export const loadStyles = (href: string) => {
  const link = document.createElement("link");
  link.href = href;
  link.rel = "stylesheet";
  document.head.appendChild(link);
  console.log(`${href} Loaded`);
};
