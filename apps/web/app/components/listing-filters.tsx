import type { CategoryOption } from "../../lib/marketplace";

export function ListingFilters(props: {
  pathname: string;
  categories: CategoryOption[];
  q: string;
  kind: string;
  stack: string;
  category: string;
  lockCategory: boolean;
}) {
  return (
    <form className="filters card" method="get" action={props.pathname}>
      <label>Search<input name="q" defaultValue={props.q} maxLength={80} /></label>
      <label>
        Product type
        <select name="kind" defaultValue={props.kind}>
          <option value="">Any</option>
          <option value="code_asset">Code asset</option>
          <option value="business_application">Business application</option>
        </select>
      </label>
      <label>Technology<input name="stack" defaultValue={props.stack} placeholder="typescript" /></label>
      {props.lockCategory ? null : (
        <label>
          Category
          <select name="category" defaultValue={props.category}>
            <option value="">Any</option>
            {props.categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </label>
      )}
      <button type="submit">Apply filters</button>
    </form>
  );
}
