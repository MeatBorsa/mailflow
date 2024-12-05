class PostAIProcessor {
    static process(aiResponse) {
        try {
            // Handle string input
            const response = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
            
            // Process the object directly
            return this.processObject(response);
        } catch (error) {
            console.error('Error in PostAIProcessor:', error);
            return aiResponse;
        }
    }

    static processObject(obj) {
        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this.processObject(item));
        }

        // Handle null or non-objects
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        // Process each property
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            // Process nested objects (including arrays)
            if (typeof value === 'object' && value !== null) {
                result[key] = this.processObject(value);
                continue;
            }

            // Process string values
            if (typeof value === 'string') {
                // Check for incoterms in any property that might contain them
                if (key.toLowerCase().includes('incoterm') || 
                    key.toLowerCase().includes('terms') ||
                    value.toLowerCase().includes('ex.') || 
                    value.toLowerCase().includes('fob') ||
                    value.toLowerCase().includes('cif')) {
                    result[key] = this.standardizeIncoterms(value);
                } else if (key === 'meat_type') {
                    result[key] = this.cleanString(value);
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    static standardizeIncoterms(incoterm) {
        if (!incoterm || typeof incoterm !== 'string') return incoterm;

        const incotermMap = {
            'ex.work': 'EXW',
            'ex work': 'EXW',
            'ex-work': 'EXW',
            'ex.works': 'EXW',
            'ex works': 'EXW',
            'ex-works': 'EXW',
            'fob': 'FOB',
            'f.o.b': 'FOB',
            'f.o.b.': 'FOB',
            'cif': 'CIF',
            'c.i.f': 'CIF',
            'c.i.f.': 'CIF',
            'cfr': 'CFR',
            'c.f.r': 'CFR',
            'c.f.r.': 'CFR',
            'dap': 'DAP',
            'd.a.p': 'DAP',
            'd.a.p.': 'DAP',
            'ddp': 'DDP',
            'd.d.p': 'DDP',
            'd.d.p.': 'DDP'
        };

        const clean = incoterm.toLowerCase().trim();
        return incotermMap[clean] || incoterm.toUpperCase();
    }

    static cleanString(str) {
        if (!str || typeof str !== 'string') return str;
        return str.trim().replace(/\s+/g, ' ');
    }
}

module.exports = PostAIProcessor; 