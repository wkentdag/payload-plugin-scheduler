import React from 'react'

// this is how we'll interface with Payload itself
import { useFieldType, DateTimeInput, useFormFields } from 'payload/components/forms';

// we'll re-use the built in Label component directly from Payload
import { Label } from 'payload/components/forms';

// we can use existing Payload types easily
import { Props } from 'payload/components/fields/Text';

// we'll import and reuse our existing validator function on the frontend, too
// import { validateHexColor } from './config';

// Import the SCSS stylesheet
import './styles.scss';
import { ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types';
import { formatDateTime } from './util';
import Icon from './Icon';

const baseClass = 'scheduler-publish-at';

// https://payloadcms.com/blog/building-a-custom-field
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
  // https://payloadcms.com/docs/admin/customizing-css#overriding-built-in-styles

  const pendingColor = 'var(--color-blue-650)'
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
        <p style={schedulePending ? { color: pendingColor } : {}}>
          <Icon color={schedulePending ? pendingColor : undefined} />
          Scheduled for {formatDateTime(pubDate)}
        </p>
      }
    </div>
  )
};

export default InputField;