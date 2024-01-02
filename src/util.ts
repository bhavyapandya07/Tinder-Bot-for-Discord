export function replacePlaceHolders(str: string, placeholders: RegExp[], targets: string[]): string {
    for (let i = 0; i < placeholders.length; i++) {
        const placeholder = placeholders[i];
        const target = targets[i];
        str = str.replace(placeholder, target);
    }
    return str;
}
