
type Props = {
  id?: string
  placeholder: string
  className?: string
  type?: 'text' | 'password' | 'search'
  onChange?: (event: any) => void
  icon: any
  name?: string
  buttonLabel: string
}

const SearchInput = ({ placeholder, icon, className, type, onChange, id, name, buttonLabel }: Props) => {

  return (
    <div>
      
      {/* <div className={`search-icon`}>
        {icon}
      </div>
      <input
        name={name}
        id={id} 
        onChange={onChange} 
        className={`search-input ${className}`} 
        placeholder={placeholder} 
        type={type} 
      /> */}

      <label className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">{buttonLabel}</label>
      <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-30">
            {icon}
          </div>
          <input 
            name={name}
            id={id} 
            type={type}
            className={`${className} text-end block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500`} 
            placeholder={placeholder}
            onChange={onChange} 
          />
          <button type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">{buttonLabel}</button>
      </div>
    </div>
  )
}
export default SearchInput;
