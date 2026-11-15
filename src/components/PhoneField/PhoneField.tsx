import { ChangeEvent, RefObject, useMemo, useState } from 'react';
import Picker, { PickerOption } from '../Picker/Picker';
import Flag from '../../containers/PricesPage/Flag';
import { COUNTRIES, countryByIso, detectCountry, flagUrl } from '../../utils/phone';
import './phoneField.css';

// A country's flag: Libya drawn locally (it is the default, so no wait), the rest from a flag CDN,
// falling back to the two letters if the image cannot load.
export const CountryFlag = ({ iso }: { iso: string }) => {
  const [broken, setBroken] = useState(false);
  if (iso === 'LY') return <span className="pk-flag"><Flag country="libya" size={26} /></span>;
  return (
    <span className="pk-flag">
      {broken ? iso : <img src={flagUrl(iso)} alt="" loading="lazy" width={26} height={18} onError={() => setBroken(true)} />}
    </span>
  );
};

type Props = {
  id: string
  iso: string
  number: string
  onChange: (iso: string, number: string) => void
  inputRef?: RefObject<HTMLInputElement>
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
  dataField?: string
}

/* Phone number with its country: Libya by default, any country from a searchable list. A number
   pasted with its code (+90…, 00971…) picks its country by itself. */
const PhoneField = ({ id, iso, number, onChange, inputRef, invalid, describedBy, disabled, dataField }: Props) => {
  const country = countryByIso(iso);
  const options: PickerOption[] = useMemo(() => COUNTRIES.map((c) => ({
    value: c.iso,
    label: c.name,
    hint: `+${c.dial}`,
    icon: <CountryFlag iso={c.iso} />,
    keywords: `${c.iso} ${c.dial} +${c.dial}`,
  })), []);

  const onType = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const found = detectCountry(value);
    if (found && found.rest.length >= 4) onChange(found.iso, found.rest);
    else onChange(iso, value);
  };

  return (
    <div className={`lg-input pf ${invalid ? 'is-invalid' : ''}`} dir="ltr">
      <Picker
        className="pf-country"
        value={iso}
        options={options}
        onChange={(next) => { onChange(next, number); window.setTimeout(() => inputRef?.current?.focus(), 0); }}
        title="مفتاح الدولة"
        searchable
        searchPlaceholder="ابحث باسم الدولة أو المفتاح"
        disabled={disabled}
        renderValue={() => (
          <>
            <CountryFlag iso={country.iso} />
            <span className="pf-dial">+{country.dial}</span>
          </>
        )}
      />
      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={iso === 'LY' ? 'tel-national' : 'tel'}
        placeholder={iso === 'LY' ? '091 234 5678' : 'رقم الهاتف'}
        value={number}
        onChange={onType}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={disabled}
        data-field={dataField}
      />
    </div>
  );
};

export default PhoneField;
