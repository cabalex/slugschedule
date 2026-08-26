export type PrereqNode = 
        | { type: "AND", children: PrereqNode[] }
        | { type: "OR", children: PrereqNode[] }
        | { type: "CLASS", course: string }
        | { type: "TEXT", text: string }
        | { type: "SERIES", children: PrereqNode[] };

export type PrerequisiteResult = {
    restrictions: string[];
    prerequisites: PrereqNode | null;
};

const classRegex = /^([A-Z]{2,4})\s?(\d{1,3}[A-Z]?)$/i;

export function parsePrerequisites(text: string): PrerequisiteResult {
    // 1. Sanitize text 
    text = text
        .replace(/&quot;/gm, "\"")
        .replace(/&amp;/gm, "&")
        .replace(/&lt;/gm, "<")
        .replace(/&gt;/gm, ">");

    // Remove the word "either" as it breaks strict class regexes
    text = text.replace(/\beither\s+/gi, '');

    // Fix lazy subject codes (e.g. "PHYS 5C and 5N" -> "PHYS 5C and PHYS 5N")
    text = text.replace(/([A-Z]{2,4})\s(\d{1,3}[A-Z]?)\s+(and|or)\s+(\d{1,3}[A-Z]?)(?!\s+[A-Z])/gi, '$1 $2 $3 $1 $4');

    // Remove redundant "is required" phrases so they don't get treated as list items
    text = text.replace(/,?\s*is\s+required/gi, '');

    // Rescue "Concurrent enrollment" sentences from being exiled to Restrictions
    // This converts the period into a semicolon so the parser treats it as a top-level AND requirement.
    text = text.replace(/\.\s*(Concurrent\s+enrollment)/gi, '; $1');

    // Preserve bracketed groups (e.g., "[A, B, and C]" -> treat as a strict unit)
    // This converts brackets into an explicit format our parser respects
    text = text.replace(/\[([^\]]+)\]/g, (match, inner) => {
        // Ensure commas inside brackets use explicit 'and' so they parse as tight ANDs
        return inner.replace(/,\s*(?!and|or)/g, ' and ');
    });

    // Translate "one of / one from" comma lists into strict Boolean ORs.
    // This prevents list commas from overriding earlier ANDs.
    text = text.replace(/(?:one\s+(?:of|from)\s+)([^;.]+)/gi, (match, list) => {
        // "A, B, or C" -> "A or B or C"
        let cleaned = list.replace(/\s*,\s*or\s+/gi, ' or ');
        // "A, B, and C" -> "A and B and C"
        cleaned = cleaned.replace(/\s*,\s*and\s+/gi, ' and ');
        // "A, B" -> "A or B" (cleans up any remaining oxford commas)
        cleaned = cleaned.replace(/\s*,\s*/g, ' or ');
        return cleaned;
    });

    // 2. Isolate the "Prerequisite(s):" block from other text and also seperate restrictions
    const restrictions: string[] = [];
    let prereqText = "";

    // This regex catches "Prerequisite:", "Prerequisites:", and "Prerequisite(s):"
    const prereqRegex = /(?:Prerequisite(?:s|\(s\))?:\s*|^(?=Concurrent\s+enrollment\s+in\s+[A-Z]))(.*?)(?:\.|$)/i;
    const prereqMatch = text.match(prereqRegex);
    
    if (prereqMatch && prereqMatch[1].trim()) {
        prereqText = prereqMatch[1].replace(/\.$/, "").trim();
        
        // Extract any surrounding sentences (like "Enrollment is restricted to...")
        const withoutPrereq = text.replace(prereqMatch[0], "").trim();
        if (withoutPrereq) {
            restrictions.push(...withoutPrereq.split('.').map(s => s.trim()).filter(Boolean));
        }
    } else {
        // If it doesn't match a standard header, check if it starts with a concurrent requirement anyway
        if (/^Concurrent\s+enrollment\s+in/i.test(text)) {
            const firstPeriod = text.indexOf('.');
            if (firstPeriod !== -1) {
                prereqText = text.substring(0, firstPeriod).trim();
                const remainder = text.substring(firstPeriod + 1).trim();
                if (remainder) restrictions.push(...remainder.split('.').map(s => s.trim()).filter(Boolean));
            } else {
                prereqText = text;
            }
        } else {
            restrictions.push(...text.split('.').map(s => s.trim()).filter(Boolean));
            return { restrictions, prerequisites: null };
        }
    }

    // Distribute "Concurrent enrollment in" across lists
    // e.g., "Concurrent enrollment in A, B, and C" -> "Concurrent enrollment in A and concurrent enrollment in B..."
    prereqText = prereqText.replace(/(Concurrent\s+enrollment\s+(?:in\s+)?)([^;.]+)/gi, (match, prefix, list) => {
        const isOrList = /\bor\b/i.test(list);
        const parts = list.split(/(\s*,\s*or\s+|\s*,\s*and\s+|\s+or\s+|\s+and\s+|\s*,\s*)/i);
        
        let result = "";
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
                result += parts[i]; 
            } else {
                const op = parts[i];
                // If the operator is an OR, leave it alone! Do not repeat the prefix.
                if (op.includes('or') || (op.trim() === ',' && isOrList)) {
                    result += op;
                } else {
                    // If it's an AND, repeat the prefix so it splits into separate UI boxes
                    result += ` and ${prefix}`;
                }
            }
        }
        return prefix + result;
    });

    // Helper to prevent shredding English idioms without numbers
    function smartSplit(textToSplit: string, regex: RegExp, joinStr: string): string[] {
        const parts = textToSplit.split(regex).filter(Boolean);
        if (parts.length <= 1) return parts;

        const rejoined: string[] = [];
        let current = parts[0];

        for (let i = 1; i < parts.length; i++) {
            const prevHasDigit = /\d/.test(current);
            const nextHasDigit = /\d/.test(parts[i]);
            
            // If both sides of the split lack numbers, it's a pure English phrase. Stitch it back!
            if (!prevHasDigit && !nextHasDigit) {
                current += joinStr + parts[i];
            } else {
                rejoined.push(current);
                current = parts[i];
            }
        }
        rejoined.push(current);
        return rejoined;
    }

    // 3. Helper to parse chunks recursively
    function parseChunk(chunk: string): PrereqNode {
        chunk = chunk.trim();

        // Temporarily hide tricky English phrases
        chunk = chunk.replace(/or higher/gi, '@@OR_HIGHER@@')
                    .replace(/or better/gi, '@@OR_BETTER@@')
                    .replace(/or equivalent/gi, '@@OR_EQUIVAL@@');

        // Remove starting "and" from chunks
        chunk = chunk.replace(/^\s*and\s+/i, '').trim();

        // BASE CASE 1: Check if the exact chunk is a single class code
        if (classRegex.test(chunk)) {
            return { type: "CLASS", course: chunk.toUpperCase() };
        }

        // BASE CASE 2: If no numbers, it's pure text (protects English idioms)
        if (!/\d/.test(chunk)) {
            chunk = chunk.replace(/@@OR_HIGHER@@/g, 'or higher')
                        .replace(/@@OR_BETTER@@/g, 'or better')
                        .replace(/@@OR_EQUIVAL@@/g, 'or equivalent');
            return { type: "TEXT", text: chunk };
        }

        // --- ORDER OF OPERATIONS FOR NATURAL LANGUAGE ---

        // LEVEL 1: Loose OR (Comma separated list like "A, B, or C")
        if (/\s*,\s*or\s+/i.test(chunk)) {
            // We split by ", or " AND bare "," to handle Oxford commas cleanly
            const parts = chunk.split(/\s*,\s*or\s+|\s*,\s*/i).filter(Boolean);
            if (parts.length > 1) return { type: "OR", children: parts.map(parseChunk) };
        }

        // LEVEL 2: Loose AND (Comma separated list like "A, B, and C")
        if (/\s*,\s*and\s+/i.test(chunk)) {
            const parts = chunk.split(/\s*,\s*and\s+|\s*,\s*/i).filter(Boolean);
            if (parts.length > 1) return { type: "AND", children: parts.map(parseChunk) };
        }

        // LEVEL 3: Tight AND
        if (/\s+and\s+/i.test(chunk)) {
            // Use smartSplit to safely parse chunks
            const parts = smartSplit(chunk, /\s+and\s+/i, ' and ');
            if (parts.length > 1) return { type: "AND", children: parts.map(parseChunk) };
        }
        
        // LEVEL 4: Tight OR
        if (/\s+or\s+/i.test(chunk)) {
            // Use smartSplit to safely parse chunks
            const parts = smartSplit(chunk, /\s+or\s+/i, ' or ');
            if (parts.length > 1) return { type: "OR", children: parts.map(parseChunk) };
        }

        // BASE CASE 3: Un-sanitize text
        chunk = chunk.replace(/@@OR_HIGHER@@/g, 'or higher')
                    .replace(/@@OR_BETTER@@/g, 'or better')
                    .replace(/@@OR_EQUIVAL@@/g, 'or equivalent');
                    
        return { type: "TEXT", text: chunk };
    }

    // 4. Handle major alternative paths first by splitting by "; or "
    const orGroups = prereqText.split(/\s*;\s*or\s+/i).filter(Boolean);

    function parseAndGroup(text: string): PrereqNode {
        // Semicolons are the absolute highest level of structural separation.
        const groups = text.split(/\s*;\s*(?:and\s+)?/i).filter(Boolean);
        
        const children: PrereqNode[] = [];
        for (const group of groups) {
            const cleanedGroup = group.replace(/^\s*(?:and|or)\s+/i, '').trim();
            const parsed = parseChunk(cleanedGroup);
            
            children.push(parsed);
        }
        
        if (children.length === 1) return children[0];
        
        return { type: "AND", children };
    }

    if (orGroups.length === 0) {
        return { restrictions, prerequisites: null };
    }

    let rootNode: PrereqNode;

    // If there is more than one orGroup, they are OR'd together at a high level
    if (orGroups.length === 1) {
        rootNode = parseAndGroup(orGroups[0]);
    } else {
        rootNode = {
            type: "OR",
            children: orGroups.map(parseAndGroup)
        };
    }

    // Pass the raw tree through our optimizer first
    rootNode = optimizeTree(rootNode);

    // Enforce top-level UI rules after optimization:
    if (rootNode.type === "OR") {
        // If the optimizer left it as an OR without AND children, it's a simple inline OR. 
        // Wrap it in a root AND to fit UI's starting state.
        const isComplex = rootNode.children.some(child => child.type === "AND");
        if (!isComplex) {
            rootNode = { type: "AND", children: [rootNode] };
        }
    } else if (rootNode.type !== "AND") {
        // If it's just a single CLASS or TEXT, wrap it in a root AND
        rootNode = { type: "AND", children: [rootNode] };
    }

    return {
        restrictions,
        prerequisites: rootNode
    };
}

// Helper to generate a unique string signature for any node
function stringifyNode(node: PrereqNode): string {
    if (node.type === "CLASS") return node.course;
    if (node.type === "TEXT") return node.text;
    if (node.type === "AND" || node.type === "OR" || node.type === "SERIES") {
        return `${node.type}(${node.children.map(stringifyNode).sort().join(",")})`;
    }
    return "";
}

// Helper to check if two Sets contain the exact same items
function eqSet(as: Set<string>, bs: Set<string>) {
    if (as.size !== bs.size) return false;
    for (const a of as) if (!bs.has(a)) return false;
    return true;
}

export function optimizeTree(node: PrereqNode): PrereqNode {
    // 1. Base cases: nothing to optimize
    if (node.type === "CLASS" || node.type === "TEXT") return node;

    // 2. Bottom-up recursion: Optimize the deepest children first
    node.children = node.children.map(optimizeTree);

    // 3. Flattening (e.g., collapse AND inside AND)
   if (node.type === "AND" || node.type === "OR") {
        const flatten = (n: PrereqNode, targetType: string): PrereqNode[] => {
            if (n.type !== targetType || (n as any)._isSemicolon || !('children' in n)) return [n];
            return n.children.flatMap(child => flatten(child, targetType));
        };
        
        node.children = node.children.flatMap(child => {
            const optimizedChild = optimizeTree(child);
            if (
                optimizedChild.type === node.type && 
                !(node as any)._isSemicolon && 
                !(optimizedChild as any)._isSemicolon &&
                'children' in optimizedChild
            ) {
                return flatten(optimizedChild, node.type);
            }
            return [optimizedChild];
        });
    }

    // 4. Series Grouping (e.g., condensing all "PHYS 5" classes)
    if (node.type === "AND") {
        const classNodes = node.children.filter(c => c.type === "CLASS");
        const otherNodes = node.children.filter(c => c.type !== "CLASS");

        if (classNodes.length > 1) {
            const groups = new Map<string, PrereqNode[]>();
            
            for (const cls of classNodes as {type: "CLASS", course: string}[]) {
                // Extract just the number (e.g., "20" from "BIOL 20A" and "BIOE 20B")
                // This allows cross-department series like Intro Bio to group together perfectly!
                const match = cls.course.match(/\d{1,3}/);
                const base = match ? match[0] : cls.course;
                
                if (!groups.has(base)) groups.set(base, []);
                groups.get(base)!.push(cls);
            }

            const seriesChildren: PrereqNode[] = [];
            for (const items of groups.values()) {
                if (items.length >= 2) seriesChildren.push({ type: "SERIES", children: items });
                else seriesChildren.push(items[0]);
            }
            node.children = [...otherNodes, ...seriesChildren];
        }
    }

    // If an AND or OR node has been reduced to exactly 1 child (e.g., all its classes became a single SERIES),
    // we unwrap it so it acts as a single item and does not trigger Complex OR Normalization!
    if ((node.type === "AND" || node.type === "OR") && node.children.length === 1) {
        return node.children[0];
    }

    // 5. Look for the Combinatorial Explosion pattern in OR nodes
    if (node.type === "OR" && node.children.length > 1 && node.children.every(c => c.type === "AND")) {
        
        const uniqueNodes = new Map<string, PrereqNode>();
        const branches: string[][] = [];

        // Collect all nodes and record which branch they appeared in
        node.children.forEach(andNode => {
            const branchIds = andNode.children.map(c => {
                const id = stringifyNode(c);
                uniqueNodes.set(id, c);
                return id;
            });
            branches.push(branchIds);
        });

        const allIds = Array.from(uniqueNodes.keys());

        // Build a conflict map: Which items appear in the same branch?
        // (Items in the same branch cannot be in the same OR group)
        const conflicts = new Map<string, Set<string>>();
        allIds.forEach(id => conflicts.set(id, new Set()));

        branches.forEach(branch => {
            for (let i = 0; i < branch.length; i++) {
                for (let j = 0; j < branch.length; j++) {
                    if (i !== j) conflicts.get(branch[i])!.add(branch[j]);
                }
            }
        });

        // Group items that have the exact same conflicts
        // e.g., AM 10 and MATH 21 will both conflict with exactly [MATH 11A, 19A, 20A]
        const groups: string[][] = [];
        const assigned = new Set<string>();

        for (const id of allIds) {
            if (assigned.has(id)) continue;
            const myConflicts = conflicts.get(id)!;
            
            const group = allIds.filter(other => eqSet(myConflicts, conflicts.get(other)!));
            group.forEach(g => assigned.add(g));
            groups.push(group);
        }

        // Verify it is a perfect Cartesian product to prevent false positives
        const expectedCombinations = groups.reduce((acc, g) => acc * g.length, 1);

        if (expectedCombinations === branches.length && groups.length > 1) {
            // We found a match! Factor it cleanly.
            return {
                type: "AND",
                children: groups.map(groupIds => {
                    if (groupIds.length === 1) return uniqueNodes.get(groupIds[0])!;
                    return {
                        type: "OR",
                        children: groupIds.map(id => uniqueNodes.get(id)!)
                    };
                })
            };
        }
    }

    // 6. Complex OR Normalization (Applies to every level of the tree)
    if (node.type === "OR") {
        const isComplexOr = node.children.some(child => child.type === "AND");
        if (isComplexOr) {
            node.children = node.children.map(child => {
                if (child.type === "AND") return child;
                return { type: "AND", children: [child] };
            });
        }
    }

    return node;
}