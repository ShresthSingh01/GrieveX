const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function fetchCases(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/grievances`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCase(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch case ${id}`);
  return res.json();
}

export async function fetchGraph(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${id}/graph`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch graph for case ${id}`);
  return res.json();
}

export async function submitGrievance(data: {
  complaint_text: string;
  title?: string;
  citizen_name?: string;
  location?: string;
  category?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create grievance');
  return res.json();
}

export async function analyzeGrievance(id: string, forceOffline: boolean = false): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${id}/analyze?force_offline=${forceOffline}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to analyze grievance');
  return res.json();
}

export async function completeTask(
  caseId: string,
  taskId: string,
  data: { evidence_title: string; evidence_content: string; submitted_by: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${caseId}/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to complete task' }));
    throw new Error(err.detail || 'Failed to complete task');
  }
  return res.json();
}

export async function approveTask(
  caseId: string,
  taskId: string,
  data: { officer_name: string; officer_role: string; decision: string; notes?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${caseId}/approve/${taskId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to approve task' }));
    throw new Error(err.detail || 'Failed to approve task');
  }
  return res.json();
}

export async function submitEvidence(
  caseId: string,
  data: { evidence_type: string; title: string; content: string; submitted_by: string; task_id?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${caseId}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit evidence');
  return res.json();
}

export async function verifyClosure(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${caseId}/verify`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to verify closure');
  return res.json();
}

export async function provideMissingInfo(
  caseId: string,
  data: { field_name: string; value: string; submitted_by: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/grievances/${caseId}/missing-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to provide missing info');
  return res.json();
}

export async function resetDemoSeed(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset-seed`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
}

export async function fetchEvaluation(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/evaluate`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to run evaluation benchmark');
  return res.json();
}
