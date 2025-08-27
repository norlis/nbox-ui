export interface TreeNode {
    name: string;
    children: TreeNode[];
}

export type BuildNode = {
    name: string;
    children: Map<string, BuildNode>;
}

export class TreeBuilder {
    private root: Map<string, BuildNode>;

    constructor(...initialPaths: string[]) {
        this.root = new Map<string, BuildNode>();
        if (initialPaths.length > 0) {
            this.addPath(...initialPaths);
        }
    }

    public addPath(...paths: string[]): void {
        for (const path of paths) {
            this.addSinglePath(path);
        }
    }

    public getTree(): TreeNode[] {
        return this.convertMapToArray(this.root);
    }

    public clear(): void {
        this.root.clear();
    }

    private addSinglePath(path: string): void {
        const parts = path.split('/').filter(part => part.length > 0);
        let currentLevel = this.root;

        for (const part of parts) {
            let node = currentLevel.get(part);
            if (!node) {
                node = { name: part, children: new Map() };
                currentLevel.set(part, node);
            }
            currentLevel = node.children;
        }
    }

    private convertMapToArray(buildNodeMap: Map<string, BuildNode>): TreeNode[] {
        const result: TreeNode[] = [];
        for (const node of buildNodeMap.values()) {
            result.push({
                name: node.name,
                children: this.convertMapToArray(node.children),
            });
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }
}