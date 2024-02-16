
type Props = {
  value?: number | string
  currencies: string[]
  onCurrencyChange?: (event: React.ChangeEvent) => void
  onInputChange?: (event: React.ChangeEvent) => void
}

const CurrencyInput = (props: Props) => {
  return (
    <div className="relative mt-1 rounded-md shadow-sm w-5/6 sm:w-1/4">
      <input
        type="number"
        name="price"
        id="price"
        className="block w-full rounded-md border-gray-300 pl-7 pr-16 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="0.00"
        onChange={props.onInputChange}
        value={props.value}
      />
      <div className="absolute inset-y-0 right-0 flex items-center">
        <select
          id="currency"
          name="currency"
          className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          onChange={props.onCurrencyChange}
        >
          {props.currencies.map((currency: string, i: number) => (
            <option key={i}>{currency}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default CurrencyInput;
