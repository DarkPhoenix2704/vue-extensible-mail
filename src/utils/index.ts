export function convertStyleStringToObj(styleString: string): {
  [key: string]: string;
} {
  const styleObj: { [key: string]: string } = {};
  const styleDeclarations: string[] = styleString.split(";");

  styleDeclarations.forEach((declaration: string) => {
    const [property, value] = declaration.split(":");
    const propName: string = property.trim();
    const propValue: string = value.trim();

    styleObj[propName] = propValue;
  });

  return styleObj;
}

export function pxToPt(px: string | number): number | null {
  return Number.isNaN(Number(px))
    ? null
    : (Number.parseInt(`${px}`, 10) * 3) / 4;
}
