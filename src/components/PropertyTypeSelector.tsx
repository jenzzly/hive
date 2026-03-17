import { useEffect } from 'react';
import { getCategories, getTypes, getSubcategories } from '../utils/propertyTaxonomy';

interface Props {
    category: string;
    type: string;
    subcategory: string;
    onChange: (field: 'category' | 'type' | 'subcategory', value: string) => void;
}

export default function PropertyTypeSelector({ category, type, subcategory, onChange }: Props) {
    const categories = getCategories();
    const types = getTypes(category);
    const subcategories = getSubcategories(category, type);

    // Reset dependent fields when parent changes
    useEffect(() => { onChange('type', ''); }, [category]);
    useEffect(() => { onChange('subcategory', ''); }, [type]);

    return (
        <>
            <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                    className="form-input"
                    value={category}
                    onChange={e => onChange('category', e.target.value)}
                    required
                >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                    className="form-input"
                    value={type}
                    onChange={e => onChange('type', e.target.value)}
                    disabled={!category}
                    required
                >
                    <option value="">Select type</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Subcategory *</label>
                <select
                    className="form-input"
                    value={subcategory}
                    onChange={e => onChange('subcategory', e.target.value)}
                    disabled={!type}
                    required
                >
                    <option value="">Select subcategory</option>
                    {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </>
    );
}