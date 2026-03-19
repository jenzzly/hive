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

    // Handle category change specifically to reset children
    const handleCategoryChange = (val: string) => {
        onChange('category', val);
        onChange('type', '');
        onChange('subcategory', '');
    };

    // Handle type change specifically to reset subcategory
    const handleTypeChange = (val: string) => {
        onChange('type', val);
        onChange('subcategory', '');
    };

    return (
        <>
            <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                    className="form-input"
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value)}
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
                    onChange={e => handleTypeChange(e.target.value)}
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