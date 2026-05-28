import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal, Stepper, Button, Group, TextInput, Select, Textarea, NumberInput,
  Checkbox, Paper, ActionIcon, Stack, MultiSelect, Text
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';

const LIVES_WITH_OPTIONS = [
  { value: 'Parents', label: 'Parents' },
  { value: 'Uncles', label: 'Uncles' },
  { value: 'Grandparents', label: 'Grandparents' },
  { value: 'Brothers', label: 'Brothers' },
  { value: 'Sisters', label: 'Sisters' },
  { value: 'Siblings', label: 'Siblings' },
  { value: 'Alone', label: 'Alone' },
  { value: 'Hostel', label: 'Hostel' },
];

const HEALTH_PROBLEMS_OPTIONS = [
  { value: 'Asthma', label: 'Asthma' },
  { value: 'Diabetes', label: 'Diabetes' },
  { value: 'Epilepsy', label: 'Epilepsy' },
  { value: 'Heart Condition', label: 'Heart Condition' },
  { value: 'Allergy', label: 'Allergy' },
  { value: 'Astigmatism', label: 'Astigmatism' },
  { value: 'Hearing Impairment', label: 'Hearing Impairment' },
  { value: 'Vision Impairment', label: 'Vision Impairment' },
  { value: 'Thyroid Disorder', label: 'Thyroid Disorder' },
  { value: 'Migraine', label: 'Migraine' },
  { value: 'Other', label: 'Other' },
];

const BEHAVIOUR_OPTIONS = [
  { value: 'ADHD', label: 'ADHD' },
  { value: 'Anxiety', label: 'Anxiety' },
  { value: 'Autism Spectrum', label: 'Autism Spectrum' },
  { value: 'Depression', label: 'Depression' },
  { value: 'Oppositional Defiant Disorder', label: 'Oppositional Defiant Disorder' },
  { value: 'Conduct Disorder', label: 'Conduct Disorder' },
  { value: 'OCD', label: 'OCD' },
  { value: 'PTSD', label: 'PTSD' },
  { value: 'Selective Mutism', label: 'Selective Mutism' },
  { value: 'Tourette Syndrome', label: 'Tourette Syndrome' },
  { value: 'Other', label: 'Other' },
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const MOBILE_ACCESS_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'Limited', label: 'Limited' },
  { value: 'No', label: 'No' },
];

const INTERNET_ACCESS_OPTIONS = [
  { value: 'Yes (home)', label: 'Yes (home)' },
  { value: 'Mobile data only', label: 'Mobile data only' },
  { value: 'No', label: 'No' },
];

const RELATION_OPTIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Guardian', label: 'Guardian' },
];

const QUALIFICATION_OPTIONS = [
  { value: 'Illiterate', label: 'Illiterate' },
  { value: 'Below 5', label: 'Below 5' },
  { value: 'Primary', label: 'Primary' },
  { value: 'Basic', label: 'Basic' },
  { value: 'Secondary', label: 'Secondary' },
  { value: '+2', label: '+2' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'Other', label: 'Other' },
];

const CONTACT_PREF_OPTIONS = [
  { value: 'Phone', label: 'Phone' },
  { value: 'Email', label: 'Email' },
  { value: 'WhatsApp', label: 'WhatsApp' },
];

const generateStudentId = (existingCount: number) => {
  const year = new Date().getFullYear();
  const padded = String(existingCount + 1).padStart(5, '0');
  return `${year}-STD-${padded}`;
};

const generateParentId = (studentId: string, parentIndex: number) => {
  const year = studentId.split('-')[0];
  return `${year}-PRT-${String(parentIndex + 1).padStart(5, '0')}`;
};

interface AddStudentWizardModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (studentId: string) => void;
  existingStudentCount: number;
}

export function AddStudentWizardModal({ opened, onClose, onSuccess, existingStudentCount }: AddStudentWizardModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    studentId: generateStudentId(existingStudentCount),
    name: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    liveWith: '',
    longTermHealth: [] as string[],
    abnormalBehaviour: [] as string[],
    mobileAccess: '',
    internetAccess: '',
    parents: [{
      id: generateParentId(generateStudentId(existingStudentCount), 0),
      relation: '',
      name: '',
      phone: '',
      email: '',
      occupation: '',
      workplace: '',
      monthlyIncome: null as number | null,
      yearlyIncome: null as number | null,
      education: '',
      contactPreference: '',
      isPrimary: false,
      bloodGroup: '',
    }],
    permanentAddress: '',
    temporaryAddress: '',
    sameAddress: false,
  });

  const addStudentMutation = useMutation({
    mutationFn: (data: any) => api.post('/students', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      notifications.show({ title: 'Success', message: 'Student added', color: 'green' });
      onSuccess(res.data._id);
      onClose();
    },
  });

  const addParent = () => {
    setForm({
      ...form,
      parents: [...form.parents, {
        id: generateParentId(form.studentId, form.parents.length),
        relation: '',
        name: '',
        phone: '',
        email: '',
        occupation: '',
        workplace: '',
        monthlyIncome: null,
        yearlyIncome: null,
        education: '',
        contactPreference: '',
        isPrimary: false,
        bloodGroup: '',
      }],
    });
  };

  const removeParent = (idx: number) => setForm({ ...form, parents: form.parents.filter((_, i) => i !== idx) });
  const updateParent = (idx: number, field: string, value: any) => {
    const updated = [...form.parents];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, parents: updated });
  };

  const nextStep = () => setActiveStep((s) => (s < 3 ? s + 1 : s));
  const prevStep = () => setActiveStep((s) => (s > 0 ? s - 1 : s));

  const handleSave = () => {
    const payload = {
      ...form,
      longTermHealth: form.longTermHealth,
      abnormalBehaviour: form.abnormalBehaviour,
      temporaryAddress: form.sameAddress ? form.permanentAddress : form.temporaryAddress,
    };
    addStudentMutation.mutate(payload);
  };

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title="Add New Student (Wizard)">
      <Stepper active={activeStep} onStepClick={setActiveStep}>
        <Stepper.Step label="Basic" description="Name, DOB, ID">
          <Stack pt="md">
            <TextInput label="Student ID" value={form.studentId} disabled />
            <TextInput label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <TextInput label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
            <Select label="Gender" data={GENDER_OPTIONS} value={form.gender} onChange={val => setForm({...form, gender: val || ''})} />
            <Select label="Blood Group" data={BLOOD_GROUP_OPTIONS} value={form.bloodGroup} onChange={val => setForm({...form, bloodGroup: val || ''})} clearable />
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Health & Behaviour" description="Health, behaviour, access">
          <Stack pt="md">
            <Select label="Lives with" data={LIVES_WITH_OPTIONS} value={form.liveWith} onChange={val => setForm({...form, liveWith: val || ''})} />
            <MultiSelect label="Long‑term health problems" data={HEALTH_PROBLEMS_OPTIONS} value={form.longTermHealth} onChange={val => setForm({...form, longTermHealth: val})} />
            <MultiSelect label="Abnormal behaviours" data={BEHAVIOUR_OPTIONS} value={form.abnormalBehaviour} onChange={val => setForm({...form, abnormalBehaviour: val})} />
            <Select label="Mobile access" data={MOBILE_ACCESS_OPTIONS} value={form.mobileAccess} onChange={val => setForm({...form, mobileAccess: val || ''})} />
            <Select label="Internet access" data={INTERNET_ACCESS_OPTIONS} value={form.internetAccess} onChange={val => setForm({...form, internetAccess: val || ''})} />
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Parents" description="Add guardians">
          <Stack pt="md">
            {form.parents.map((p, idx) => (
              <Paper key={idx} withBorder p="md" mt="md">
                <Group justify="space-between" mb="sm">
                  <Text size="sm" c="dimmed">Parent ID: {p.id}</Text>
                  <ActionIcon color="red" onClick={() => removeParent(idx)}><IconTrash size={16} /></ActionIcon>
                </Group>
                <Select label="Relation" data={RELATION_OPTIONS} value={p.relation} onChange={val => updateParent(idx, 'relation', val)} />
                <TextInput label="Full Name" value={p.name} onChange={e => updateParent(idx, 'name', e.target.value)} />
                <TextInput label="Phone" value={p.phone} onChange={e => updateParent(idx, 'phone', e.target.value)} />
                <TextInput label="Email" value={p.email} onChange={e => updateParent(idx, 'email', e.target.value)} />
                <TextInput label="Occupation" value={p.occupation} onChange={e => updateParent(idx, 'occupation', e.target.value)} />
                <TextInput label="Workplace" value={p.workplace} onChange={e => updateParent(idx, 'workplace', e.target.value)} />
                <NumberInput label="Monthly Income" value={p.monthlyIncome} onChange={val => updateParent(idx, 'monthlyIncome', val)} />
                <NumberInput label="Yearly Income" value={p.yearlyIncome} onChange={val => updateParent(idx, 'yearlyIncome', val)} />
                <Select label="Education" data={QUALIFICATION_OPTIONS} value={p.education} onChange={val => updateParent(idx, 'education', val)} />
                <Select label="Contact preference" data={CONTACT_PREF_OPTIONS} value={p.contactPreference} onChange={val => updateParent(idx, 'contactPreference', val)} />
                <Checkbox label="Primary contact" checked={p.isPrimary} onChange={e => updateParent(idx, 'isPrimary', e.currentTarget.checked)} mt="sm" />
                <Select label="Blood Group" data={BLOOD_GROUP_OPTIONS} value={p.bloodGroup} onChange={val => updateParent(idx, 'bloodGroup', val)} clearable />
              </Paper>
            ))}
            <Button onClick={addParent} leftSection={<IconPlus size={14} />}>Add Parent/Guardian</Button>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Addresses" description="Permanent & temporary">
          <Stack pt="md">
            <Textarea label="Permanent Address" value={form.permanentAddress} onChange={e => setForm({...form, permanentAddress: e.target.value})} />
            <Checkbox label="Same as permanent address" checked={form.sameAddress} onChange={e => setForm({...form, sameAddress: e.currentTarget.checked})} />
            {!form.sameAddress && <Textarea label="Temporary Address" value={form.temporaryAddress} onChange={e => setForm({...form, temporaryAddress: e.target.value})} />}
          </Stack>
        </Stepper.Step>
      </Stepper>

      <Group justify="space-between" mt="xl">
        <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>Back</Button>
        {activeStep === 3 ? <Button onClick={handleSave} loading={addStudentMutation.isPending}>Save Student</Button> : <Button onClick={nextStep}>Next</Button>}
      </Group>
    </Modal>
  );
}