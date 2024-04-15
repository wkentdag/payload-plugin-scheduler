import React from 'react'

// this is how we'll interface with Payload itself
import { useFieldType, TextInput, DateTimeInput, useFormFields, useAllFormFields, useFormModified, Text } from 'payload/components/forms';

// we'll re-use the built in Label component directly from Payload
import { Label } from 'payload/components/forms';

// we can use existing Payload types easily
import { Props } from 'payload/components/fields/Text';

// we'll import and reuse our existing validator function on the frontend, too
// import { validateHexColor } from './config';

// Import the SCSS stylesheet
// import './styles.scss';
import { ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types';
import { formatDateTime } from './util';

const baseClass = 'scheduler-publish-at';

const InputField: (datePickerProps: ConditionalDateProps) => React.FC<Props> = (datePickerProps) => (props) => {
  const {
    label,
    required
  } = props;

  const path = props.path!

  const {
    value = undefined,
    initialValue,
    setValue,
  } = useFieldType({
    path,
    // validate: validateHexColor,
  });

  // db returns string, updates from date-picker return Date
  const pubDate = value && typeof value === 'object' ? value as Date : new Date(value as string)

  const status = useFormFields(([fields]) => fields._status)
  const scheduled = value && status.valid && pubDate > new Date()
  const schedulePending = value !== initialValue
  const color = schedulePending ? 'var(--color-warning-650)' : 'var(--color-blue-650)'

  return (
    <div className={baseClass}>
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <DateTimeInput
        path={path}
        value={value as Date | undefined}
        onChange={setValue}
        datePickerProps={datePickerProps}
      />
      {
        scheduled &&
        <p style={{ paddingTop: '0.5rem', color, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '2px', marginRight: '2px' }}>
            <circle cx="12" cy="12" r="9" stroke={color} stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} />
            <path d="M12 6V12L16.5 16.5" stroke={color} stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} />
          </svg>
          Scheduled for {formatDateTime(pubDate)}
        </p>
      }
    </div>
  )
};

export default InputField;