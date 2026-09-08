import * as React from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient( 95deg,#28f221 0%,#40e95c 50%,#37b948 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient( 95deg,#28f221 0%,#40e95c 50%,#37b948 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage:
      'linear-gradient( 136deg, #2eeb3d 0%, #30c538 50%, #238a34 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage:
      'linear-gradient( 136deg, #2eeb3d 0%, #30c538 50%, #238a34 100%)',
  }),
}));

function ColorlibStepIcon(props: StepIconProps, localProps: Props) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {};
  localProps?.steps.forEach((step, i) => {
    const Icon = step.stepIcon;
    icons[i + 1] = <Icon className="text-2xl" />;
  });

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

type Props = {
  acriveStep: number
  steps: {
    label: string
    stepIcon: any
  }[]
}

const CustomStepper = (props: Props) => {
  return (
    <Stack sx={{ width: '100%' }} spacing={4}>
      <Stepper alternativeLabel activeStep={props.acriveStep} connector={<ColorlibConnector />}>
        {props.steps.map((step) => (
          <Step key={step.label}>
            <StepLabel StepIconComponent={(stepProps) => ColorlibStepIcon(stepProps, props)}><strong className="text-lg">{step.label}</strong></StepLabel>
          </Step>
        ))}
      </Stepper>
    </Stack>
  )
}

export default CustomStepper;
