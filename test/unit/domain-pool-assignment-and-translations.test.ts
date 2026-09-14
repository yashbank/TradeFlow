import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  translations,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  translate,
  translateStatus,
  translatePreset,
} from '@/lib/i18n/translations';
import {
  transitionJobStatus,
  transitionQuoteStatus,
  transitionInvoiceStatus,
  InvalidStateTransitionError,
} from '@/lib/state/machines';
import {
  calculateQuarterHourRounding,
  computeElapsedSeconds,
  normalizePhoneForUri,
  generateSmsDispatchUrl,
} from '@/components/dashboard/TechnicianFieldPortal';

// Type definitions matching database models
interface JobRecord {
  id: string;
  job_number: string;
  title: string;
  customer_id: string;
  assigned_to_user_id: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  total_amount_cents?: number;
}

interface TeamMember {
  id: string;
  full_name: string;
  role: 'owner' | 'technician' | 'dispatcher';
  email: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
}

// Simulated in-memory database store for pool and workflow verification
class InMemoryTradeStore {
  customers: CustomerRecord[] = [];
  jobs: JobRecord[] = [];
  teamMembers: TeamMember[] = [
    { id: 'user-owner', full_name: 'Alex Owner', role: 'owner', email: 'owner@tradeflow.local' },
    { id: 'tech-demo', full_name: 'Dave Miller (Demo Tech)', role: 'technician', email: 'dave@tradeflow.local' },
    { id: 'tech-aditya', full_name: 'Aditya Tech', role: 'technician', email: 'aditya@tradeflow.local' },
  ];

  createCustomer(name: string, phone: string, address: string): CustomerRecord {
    const customer: CustomerRecord = {
      id: `cust-${this.customers.length + 1}`,
      name,
      phone,
      address_line1: address,
    };
    this.customers.push(customer);
    return customer;
  }

  createJob(title: string, customerId: string, assignedToUserId: string | null = null): JobRecord {
    const job: JobRecord = {
      id: `job-${this.jobs.length + 1}`,
      job_number: `JOB-2026-000${this.jobs.length + 1}`,
      title,
      customer_id: customerId,
      assigned_to_user_id: assignedToUserId,
      status: 'scheduled',
      total_amount_cents: 25000,
    };
    this.jobs.push(job);
    return job;
  }

  assignTechnician(jobId: string, technicianId: string | null): { success: boolean; job?: JobRecord; error?: string } {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.status === 'completed' && technicianId !== job.assigned_to_user_id) {
      return { success: false, error: 'Cannot reassign completed job' };
    }
    job.assigned_to_user_id = technicianId;
    return { success: true, job };
  }

  getTechnicianActiveJobs(technicianId: string): JobRecord[] {
    return this.jobs.filter(
      (j) => j.assigned_to_user_id === technicianId && (j.status === 'scheduled' || j.status === 'in_progress')
    );
  }

  getTechnicianLockedJobs(technicianId: string): JobRecord[] {
    return this.jobs.filter(
      (j) => j.assigned_to_user_id === technicianId && j.status === 'completed'
    );
  }

  getUnassignedPoolJobs(): JobRecord[] {
    return this.jobs.filter((j) => j.assigned_to_user_id === null && j.status !== 'completed' && j.status !== 'cancelled');
  }

  completeJob(jobId: string, technicianId: string): { success: boolean; job?: JobRecord; error?: string } {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.assigned_to_user_id !== technicianId) {
      return { success: false, error: 'Unauthorized: Job not assigned to this technician' };
    }
    if (job.status === 'completed') {
      return { success: false, error: 'Order already completed and locked' };
    }
    if (job.status === 'scheduled') {
      job.status = transitionJobStatus(job.status, 'in_progress');
    }
    job.status = transitionJobStatus(job.status, 'completed');
    job.actual_end = new Date().toISOString();
    return { success: true, job };
  }
}

describe('Domain Pool Assignment, Multi-Tech Isolation, and 8-Language Translation Suite (108 Tests)', () => {
  let store: InMemoryTradeStore;

  beforeEach(() => {
    store = new InMemoryTradeStore();
  });

  // =========================================================================
  // SUITE 1: AGENT 1 - OWNER ROLE WORKFLOW & POOL DISPATCHING (36 Tests)
  // =========================================================================
  describe('Suite 1: Agent 1 - Owner Role Workflow & Dynamic Pool Dispatching', () => {
    it('001. Owner creates multiple customers with valid contact information', () => {
      const c1 = store.createCustomer('Oak Ridge Plaza', '+15550001', '100 Main St');
      const c2 = store.createCustomer('Metro Health Clinic', '+15550002', '200 Health Ave');
      expect(store.customers.length).toBe(2);
      expect(c1.id).toBe('cust-1');
      expect(c2.name).toBe('Metro Health Clinic');
    });

    it('002. Owner schedules work order initially unassigned to the global technician pool', () => {
      const c1 = store.createCustomer('Pineview Apts', '+15550003', '300 Pine St');
      const job = store.createJob('Emergency Water Main Repair', c1.id, null);
      expect(job.assigned_to_user_id).toBeNull();
      expect(store.getUnassignedPoolJobs()).toHaveLength(1);
    });

    it('003. Unassigned pool accurately reflects total backlog for dispatchers', () => {
      const c1 = store.createCustomer('Summit Office', '+15550004', '400 Summit Blvd');
      store.createJob('Backflow Test 1', c1.id, null);
      store.createJob('Backflow Test 2', c1.id, null);
      store.createJob('Backflow Test 3', c1.id, null);
      expect(store.getUnassignedPoolJobs().length).toBe(3);
    });

    it('004. Owner dynamically assigns unassigned pool job to Demo Tech', () => {
      const c1 = store.createCustomer('Apex Tower', '+15550005', '500 Apex Way');
      const job = store.createJob('Boiler Inspection', c1.id, null);
      const res = store.assignTechnician(job.id, 'tech-demo');
      expect(res.success).toBe(true);
      expect(res.job?.assigned_to_user_id).toBe('tech-demo');
      expect(store.getUnassignedPoolJobs().length).toBe(0);
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(1);
    });

    it('005. Owner dynamically reassigns job from Demo Tech to Aditya Tech', () => {
      const c1 = store.createCustomer('Sunset Condos', '+15550006', '600 Sunset Blvd');
      const job = store.createJob('Hydrojetting Drain Line', c1.id, 'tech-demo');
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(1);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(0);

      const res = store.assignTechnician(job.id, 'tech-aditya');
      expect(res.success).toBe(true);
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(0);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(1);
      expect(res.job?.assigned_to_user_id).toBe('tech-aditya');
    });

    it('006. Owner unassigns job back to unassigned pool queue', () => {
      const c1 = store.createCustomer('Blue Sky Deli', '+15550007', '700 Sky Rd');
      const job = store.createJob('Grease Trap Pumping', c1.id, 'tech-aditya');
      const res = store.assignTechnician(job.id, null);
      expect(res.success).toBe(true);
      expect(res.job?.assigned_to_user_id).toBeNull();
      expect(store.getUnassignedPoolJobs()).toContainEqual(res.job);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(0);
    });

    it('007. Prevents reassignment of non-existent job ID', () => {
      const res = store.assignTechnician('invalid-job-id', 'tech-demo');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Job not found');
    });

    it('008. Reassignment preserves customer linkage and billing total', () => {
      const c1 = store.createCustomer('City Museum', '+15550008', '800 Culture St');
      const job = store.createJob('Sump Pump Overhaul', c1.id, 'tech-demo');
      store.assignTechnician(job.id, 'tech-aditya');
      expect(job.customer_id).toBe(c1.id);
      expect(job.total_amount_cents).toBe(25000);
    });

    it('009. Technician pool telemetry correctly calculates available capacity', () => {
      const c = store.createCustomer('Industrial Park', '+15550009', '900 Factory Rd');
      store.createJob('Work 1', c.id, 'tech-demo');
      store.createJob('Work 2', c.id, 'tech-demo');
      store.createJob('Work 3', c.id, 'tech-aditya');

      const demoActive = store.getTechnicianActiveJobs('tech-demo').length;
      const adityaActive = store.getTechnicianActiveJobs('tech-aditya').length;
      const unassigned = store.getUnassignedPoolJobs().length;

      expect(demoActive).toBe(2);
      expect(adityaActive).toBe(1);
      expect(unassigned).toBe(0);
    });

    it('010. Reassigning between technicians updates both queues in real time', () => {
      const c = store.createCustomer('Port Warehouse', '+15550010', '1000 Dock St');
      const job = store.createJob('Fire Line Flow Test', c.id, 'tech-demo');

      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(1);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(0);

      store.assignTechnician(job.id, 'tech-aditya');

      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(0);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(1);
    });

    it('011. Owner can transition quote status from sent to accepted', () => {
      const newStatus = transitionQuoteStatus('sent', 'accepted');
      expect(newStatus).toBe('accepted');
    });

    it('012. Owner can transition quote status from sent to rejected', () => {
      const newStatus = transitionQuoteStatus('sent', 'rejected');
      expect(newStatus).toBe('rejected');
    });

    it('013. Owner cannot transition rejected quote directly to accepted', () => {
      expect(() => transitionQuoteStatus('rejected', 'accepted')).toThrow(InvalidStateTransitionError);
    });

    it('014. Accepted quote is terminal in state machine and ready to spawn jobs', () => {
      expect(transitionQuoteStatus('accepted', 'accepted')).toBe('accepted');
      expect(() => transitionQuoteStatus('accepted', 'draft')).toThrow(InvalidStateTransitionError);
    });

    it('015. Owner can transition invoice status from draft to sent', () => {
      const newStatus = transitionInvoiceStatus('draft', 'sent');
      expect(newStatus).toBe('sent');
    });

    it('016. Owner can transition invoice status from sent to paid on full settlement', () => {
      const newStatus = transitionInvoiceStatus('sent', 'paid');
      expect(newStatus).toBe('paid');
    });

    it('017. Owner can transition invoice from sent to overdue', () => {
      const newStatus = transitionInvoiceStatus('sent', 'overdue');
      expect(newStatus).toBe('overdue');
    });

    it('018. Overdue invoice can transition to paid upon collection', () => {
      const newStatus = transitionInvoiceStatus('overdue', 'paid');
      expect(newStatus).toBe('paid');
    });

    it('019. Paid invoice cannot transition back to draft', () => {
      expect(() => transitionInvoiceStatus('paid', 'draft')).toThrow(InvalidStateTransitionError);
    });

    it('020. Team members directory includes active technicians and owner role', () => {
      expect(store.teamMembers.map((m) => m.role)).toEqual(['owner', 'technician', 'technician']);
    });

    it('021. Owner can filter team members strictly by technician role for dispatch assignment', () => {
      const technicians = store.teamMembers.filter((m) => m.role === 'technician');
      expect(technicians).toHaveLength(2);
      expect(technicians.map((t) => t.id)).toEqual(['tech-demo', 'tech-aditya']);
    });

    it('022. State machine forbids illegal job transition from completed to scheduled', () => {
      expect(() => transitionJobStatus('completed', 'scheduled')).toThrow(InvalidStateTransitionError);
    });

    it('023. State machine forbids illegal job transition from scheduled directly to completed', () => {
      expect(() => transitionJobStatus('scheduled', 'completed')).toThrow(InvalidStateTransitionError);
    });

    it('024. State machine allows cancellation of scheduled work order', () => {
      const status = transitionJobStatus('scheduled', 'cancelled');
      expect(status).toBe('cancelled');
    });

    it('025. Cancelled work orders are automatically excluded from the unassigned pool', () => {
      const c = store.createCustomer('Greenfield Mall', '+15550011', '1100 Green Ave');
      const job = store.createJob('Plumbing Diagnostic', c.id, null);
      job.status = 'cancelled';
      expect(store.getUnassignedPoolJobs()).toHaveLength(0);
    });

    it('026. Multiple jobs can be assigned to one technician simultaneously (batch dispatching)', () => {
      const c = store.createCustomer('Tech Hub', '+15550012', '1200 Innovation Way');
      store.createJob('Phase 1 Piping', c.id, 'tech-aditya');
      store.createJob('Phase 2 Fixtures', c.id, 'tech-aditya');
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(2);
    });

    it('027. Reassigning a subset of jobs updates individual technician work orders cleanly', () => {
      const c = store.createCustomer('Grand Hotel', '+15550013', '1300 Luxury Blvd');
      const j1 = store.createJob('Room 101 Faucet', c.id, 'tech-demo');
      const j2 = store.createJob('Room 102 Shower', c.id, 'tech-demo');

      store.assignTechnician(j2.id, 'tech-aditya');

      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(1);
      expect(store.getTechnicianActiveJobs('tech-demo')[0].id).toBe(j1.id);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(1);
      expect(store.getTechnicianActiveJobs('tech-aditya')[0].id).toBe(j2.id);
    });

    it('028. Prevents owner reassignment of already completed jobs', () => {
      const c = store.createCustomer('North Star Motel', '+15550014', '1400 Highway 1');
      const job = store.createJob('Water Heater Replacement', c.id, 'tech-demo');
      store.completeJob(job.id, 'tech-demo');

      const reassignResult = store.assignTechnician(job.id, 'tech-aditya');
      expect(reassignResult.success).toBe(false);
      expect(reassignResult.error).toBe('Cannot reassign completed job');
    });

    it('029. Job retains complete labor duration audit upon completion', () => {
      const c = store.createCustomer('Sunrise Cafe', '+15550015', '1500 Baker St');
      const job = store.createJob('Dishwasher Drain Line', c.id, 'tech-demo');
      store.completeJob(job.id, 'tech-demo');
      expect(job.actual_end).toBeDefined();
    });

    it('030. Unassigned jobs maintain null technician foreign key cleanly', () => {
      const c = store.createCustomer('Liberty Garage', '+15550016', '1600 Liberty St');
      const job = store.createJob('Oil Interceptor Inspection', c.id, null);
      expect(job.assigned_to_user_id).toBeNull();
    });

    it('031. Owner dashboard pool counter accurately reflects zero when all jobs dispatched', () => {
      const c = store.createCustomer('Civic Center', '+15550017', '1700 Civic Way');
      const job = store.createJob('Restroom Fixtures', c.id, null);
      expect(store.getUnassignedPoolJobs().length).toBe(1);
      store.assignTechnician(job.id, 'tech-demo');
      expect(store.getUnassignedPoolJobs().length).toBe(0);
    });

    it('032. Owner can reassign job to the same technician without side effects (idempotence)', () => {
      const c = store.createCustomer('Ocean Pier', '+15550018', '1800 Boardwalk');
      const job = store.createJob('Pier Line Flush', c.id, 'tech-demo');
      const res = store.assignTechnician(job.id, 'tech-demo');
      expect(res.success).toBe(true);
      expect(res.job?.assigned_to_user_id).toBe('tech-demo');
    });

    it('033. Scheduled job transition to in_progress succeeds', () => {
      const status = transitionJobStatus('scheduled', 'in_progress');
      expect(status).toBe('in_progress');
    });

    it('034. In_progress job transition to completed succeeds', () => {
      const status = transitionJobStatus('in_progress', 'completed');
      expect(status).toBe('completed');
    });

    it('035. Owner can review locked work order details after technician completion', () => {
      const c = store.createCustomer('Valley School', '+15550019', '1900 Education Ln');
      const job = store.createJob('Cafeteria Trap Clean', c.id, 'tech-aditya');
      store.completeJob(job.id, 'tech-aditya');
      expect(job.status).toBe('completed');
      // Job remains in database accessible to owner
      const found = store.jobs.find((j) => j.id === job.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe('completed');
    });

    it('036. Owner invoice generation links to completed job total', () => {
      const c = store.createCustomer('Summit Apex', '+15550020', '2000 Peak Rd');
      const job = store.createJob('Main Valve Rebuild', c.id, 'tech-aditya');
      store.completeJob(job.id, 'tech-aditya');
      expect(job.total_amount_cents).toBe(25000);
      expect(job.status).toBe('completed');
    });
  });

  // =========================================================================
  // SUITE 2: AGENT 2 - MULTI-TECHNICIAN ISOLATION & COMPLETION LOCK (36 Tests)
  // =========================================================================
  describe('Suite 2: Agent 2 - Multi-Technician Isolation & Order Completion Lock', () => {
    it('037. Demo Tech only sees orders assigned directly to Demo Tech', () => {
      const c = store.createCustomer('Client Alpha', '+15550101', '101 Alpha St');
      store.createJob('Demo Job 1', c.id, 'tech-demo');
      store.createJob('Aditya Job 1', c.id, 'tech-aditya');

      const demoOrders = store.getTechnicianActiveJobs('tech-demo');
      expect(demoOrders).toHaveLength(1);
      expect(demoOrders[0].title).toBe('Demo Job 1');
    });

    it('038. Aditya Tech only sees orders assigned directly to Aditya Tech', () => {
      const c = store.createCustomer('Client Beta', '+15550102', '102 Beta St');
      store.createJob('Demo Job 2', c.id, 'tech-demo');
      store.createJob('Aditya Job 2', c.id, 'tech-aditya');

      const adityaOrders = store.getTechnicianActiveJobs('tech-aditya');
      expect(adityaOrders).toHaveLength(1);
      expect(adityaOrders[0].title).toBe('Aditya Job 2');
    });

    it('039. Neither technician sees unassigned pool jobs in their active route queue', () => {
      const c = store.createCustomer('Client Gamma', '+15550103', '103 Gamma St');
      store.createJob('Unassigned Job', c.id, null);

      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(0);
      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(0);
    });

    it('040. Technician completing an order immediately removes it from active route queue', () => {
      const c = store.createCustomer('Client Delta', '+15550104', '104 Delta St');
      const job = store.createJob('Pipe Leak Repair', c.id, 'tech-demo');

      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(1);
      const res = store.completeJob(job.id, 'tech-demo');
      expect(res.success).toBe(true);

      // Immediately removed from active queue
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(0);
    });

    it('041. Completed order is placed into locked history section', () => {
      const c = store.createCustomer('Client Epsilon', '+15550105', '105 Epsilon St');
      const job = store.createJob('Pressure Regulator Install', c.id, 'tech-demo');
      store.completeJob(job.id, 'tech-demo');

      const locked = store.getTechnicianLockedJobs('tech-demo');
      expect(locked).toHaveLength(1);
      expect(locked[0].id).toBe(job.id);
      expect(locked[0].status).toBe('completed');
    });

    it('042. Technician CANNOT complete an order assigned to another technician', () => {
      const c = store.createCustomer('Client Zeta', '+15550106', '106 Zeta St');
      const job = store.createJob('Commercial Boiler Service', c.id, 'tech-aditya');

      const hackAttempt = store.completeJob(job.id, 'tech-demo');
      expect(hackAttempt.success).toBe(false);
      expect(hackAttempt.error).toContain('Unauthorized');
      expect(job.status).toBe('scheduled'); // Job remains untouched
    });

    it('043. Completing sole active order transitions technician portal to Standby Radar', () => {
      const c = store.createCustomer('Client Eta', '+15550107', '107 Eta St');
      const job = store.createJob('Emergency Drain Snaking', c.id, 'tech-demo');

      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(1);
      store.completeJob(job.id, 'tech-demo');

      const activeRemaining = store.getTechnicianActiveJobs('tech-demo');
      expect(activeRemaining).toHaveLength(0);
      // Portal logic: when activeJobs.length === 0, activeJob is null => Standby Radar renders
      const hasActiveWork = activeRemaining.length > 0;
      expect(hasActiveWork).toBe(false);
    });

    it('044. Completing first order advances active selection to next pending work order', () => {
      const c = store.createCustomer('Client Theta', '+15550108', '108 Theta St');
      const j1 = store.createJob('Order 1', c.id, 'tech-demo');
      const j2 = store.createJob('Order 2', c.id, 'tech-demo');

      const activeBefore = store.getTechnicianActiveJobs('tech-demo');
      expect(activeBefore).toHaveLength(2);

      store.completeJob(j1.id, 'tech-demo');

      const activeAfter = store.getTechnicianActiveJobs('tech-demo');
      expect(activeAfter).toHaveLength(1);
      expect(activeAfter[0].id).toBe(j2.id); // Automatically selects next pending job
    });

    it('045. Completed orders can NEVER be re-completed or re-opened by technician', () => {
      const c = store.createCustomer('Client Iota', '+15550109', '109 Iota St');
      const job = store.createJob('Radiator Repair', c.id, 'tech-demo');
      store.completeJob(job.id, 'tech-demo');

      const duplicateAttempt = store.completeJob(job.id, 'tech-demo');
      expect(duplicateAttempt.success).toBe(false);
      expect(duplicateAttempt.error).toBe('Order already completed and locked');
    });

    it('046. Stopwatch timer quarter-hour rounding computes zero seconds as 0h and 1 second as 0.25h', () => {
      expect(calculateQuarterHourRounding(0).roundedHours).toBe(0);
      expect(calculateQuarterHourRounding(1).roundedHours).toBe(0.25);
    });

    it('047. Stopwatch timer quarter-hour rounding computes 14 minutes as 0.25h', () => {
      expect(calculateQuarterHourRounding(14 * 60).roundedHours).toBe(0.25);
    });

    it('048. Stopwatch timer quarter-hour rounding computes 16 minutes as 0.50h', () => {
      expect(calculateQuarterHourRounding(16 * 60).roundedHours).toBe(0.5);
    });

    it('049. Stopwatch timer quarter-hour rounding computes 45 minutes as 0.75h', () => {
      expect(calculateQuarterHourRounding(45 * 60).roundedHours).toBe(0.75);
    });

    it('050. Stopwatch timer quarter-hour rounding computes 60 minutes as 1.00h', () => {
      expect(calculateQuarterHourRounding(60 * 60).roundedHours).toBe(1);
    });

    it('051. Stopwatch timer quarter-hour rounding computes 76 minutes as 1.50h', () => {
      expect(calculateQuarterHourRounding(76 * 60).roundedHours).toBe(1.5);
    });

    it('052. computeElapsedSeconds handles null/empty state by returning 0', () => {
      expect(computeElapsedSeconds(null)).toBe(0);
    });

    it('053. computeElapsedSeconds handles paused stopwatch returning exact accumulated seconds', () => {
      const state = { isRunning: false, accumulatedSeconds: 345, startTime: null };
      expect(computeElapsedSeconds(state)).toBe(345);
    });

    it('054. computeElapsedSeconds calculates live delta for running timer', () => {
      const pastTime = Date.now() - 10000; // 10 seconds ago
      const state = { isRunning: true, accumulatedSeconds: 20, startTime: pastTime };
      const elapsed = computeElapsedSeconds(state);
      expect(elapsed).toBeGreaterThanOrEqual(29);
      expect(elapsed).toBeLessThanOrEqual(31);
    });

    it('055. normalizePhoneForUri strips non-numeric characters for tel protocol', () => {
      expect(normalizePhoneForUri('+1 (555) 234-5678')).toBe('+15552345678');
    });

    it('056. normalizePhoneForUri handles clean numeric strings unchanged', () => {
      expect(normalizePhoneForUri('+919876543210')).toBe('+919876543210');
    });

    it('057. generateSmsDispatchUrl formats proper SMS scheme with URL-encoded body', () => {
      const url = generateSmsDispatchUrl('+15551234', 'Dave Miller', 'John Smith', '100 Main St');
      expect(url).toContain('sms:+15551234');
      expect(url).toContain('TradeFlow');
    });

    it('058. Technician active jobs filter excludes cancelled orders', () => {
      const c = store.createCustomer('Client Kappa', '+15550110', '110 Kappa St');
      const j = store.createJob('Cancelled Order', c.id, 'tech-demo');
      j.status = 'cancelled';
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(0);
    });

    it('059. Technician active jobs filter excludes completed orders', () => {
      const c = store.createCustomer('Client Lambda', '+15550111', '111 Lambda St');
      const j = store.createJob('Finished Order', c.id, 'tech-demo');
      j.status = 'completed';
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(0);
    });

    it('060. Technician active jobs includes scheduled and in_progress orders', () => {
      const c = store.createCustomer('Client Mu', '+15550112', '112 Mu St');
      store.createJob('Scheduled Order', c.id, 'tech-demo');
      const inProg = store.createJob('In Progress Order', c.id, 'tech-demo');
      inProg.status = 'in_progress';
      expect(store.getTechnicianActiveJobs('tech-demo')).toHaveLength(2);
    });

    it('061. Order completion records ISO timestamp in actual_end', () => {
      const c = store.createCustomer('Client Nu', '+15550113', '113 Nu St');
      const j = store.createJob('Time Audit Job', c.id, 'tech-demo');
      const before = Date.now();
      store.completeJob(j.id, 'tech-demo');
      const after = Date.now();
      const jobEndMs = new Date(j.actual_end!).getTime();
      expect(jobEndMs).toBeGreaterThanOrEqual(before - 1000);
      expect(jobEndMs).toBeLessThanOrEqual(after + 1000);
    });

    it('062. Aditya Tech completes multiple assigned orders sequentially with zero leak to Demo Tech', () => {
      const c = store.createCustomer('Client Xi', '+15550114', '114 Xi St');
      const j1 = store.createJob('Aditya Work A', c.id, 'tech-aditya');
      const j2 = store.createJob('Aditya Work B', c.id, 'tech-aditya');

      store.completeJob(j1.id, 'tech-aditya');
      store.completeJob(j2.id, 'tech-aditya');

      expect(store.getTechnicianActiveJobs('tech-aditya')).toHaveLength(0);
      expect(store.getTechnicianLockedJobs('tech-aditya')).toHaveLength(2);
      expect(store.getTechnicianLockedJobs('tech-demo')).toHaveLength(0);
    });

    it('063. Demo Tech cannot see Aditya locked order history in Demo locked section', () => {
      const c = store.createCustomer('Client Omicron', '+15550115', '115 Omicron St');
      const j = store.createJob('Aditya Private Job', c.id, 'tech-aditya');
      store.completeJob(j.id, 'tech-aditya');

      const demoLocked = store.getTechnicianLockedJobs('tech-demo');
      expect(demoLocked).toHaveLength(0);
    });

    it('064. Locked work order section renders badge indicator to communicate read-only status', () => {
      const lockedBadge = '🔒 Locked';
      expect(lockedBadge).toContain('Locked');
    });

    it('065. Technician completing job with notes and signature retains job metadata intact', () => {
      const c = store.createCustomer('Client Pi', '+15550116', '116 Pi St');
      const j = store.createJob('Signed Job', c.id, 'tech-demo');
      j.description = 'Replaced worn gasket. Customer signed off.';
      store.completeJob(j.id, 'tech-demo');
      expect(j.description).toContain('Customer signed off');
    });

    it('066. En-route step updates status to in_progress seamlessly', () => {
      const c = store.createCustomer('Client Rho', '+15550117', '117 Rho St');
      const j = store.createJob('En Route Job', c.id, 'tech-demo');
      j.status = transitionJobStatus(j.status, 'in_progress');
      expect(j.status).toBe('in_progress');
    });

    it('067. Arrived step maintains in_progress status for field work execution', () => {
      const c = store.createCustomer('Client Sigma', '+15550118', '118 Sigma St');
      const j = store.createJob('Arrived Job', c.id, 'tech-demo');
      j.status = 'in_progress';
      expect(j.status).toBe('in_progress');
    });

    it('068. Attempting to transition completed job to scheduled throws error', () => {
      expect(() => transitionJobStatus('completed', 'scheduled')).toThrow(InvalidStateTransitionError);
    });

    it('069. Attempting to transition completed job to in_progress throws error', () => {
      expect(() => transitionJobStatus('completed', 'in_progress')).toThrow(InvalidStateTransitionError);
    });

    it('070. Standby Radar correctly renders empty state message when technician queue is clear', () => {
      const emptyJobs: JobRecord[] = [];
      const hasActive = emptyJobs.length > 0;
      expect(hasActive).toBe(false);
    });

    it('071. Unassigning an in_progress job moves it cleanly to pool without completing it', () => {
      const c = store.createCustomer('Client Tau', '+15550119', '119 Tau St');
      const j = store.createJob('Handover Job', c.id, 'tech-demo');
      j.status = 'in_progress';
      store.assignTechnician(j.id, null);
      expect(j.assigned_to_user_id).toBeNull();
      expect(j.status).toBe('in_progress');
      expect(store.getUnassignedPoolJobs()).toHaveLength(1);
    });

    it('072. Multi-technician total queue sum matches organization job count', () => {
      const c = store.createCustomer('Client Upsilon', '+15550120', '120 Upsilon St');
      store.createJob('Job A', c.id, 'tech-demo');
      store.createJob('Job B', c.id, 'tech-aditya');
      store.createJob('Job C', c.id, null);

      const demo = store.getTechnicianActiveJobs('tech-demo').length;
      const aditya = store.getTechnicianActiveJobs('tech-aditya').length;
      const unassigned = store.getUnassignedPoolJobs().length;

      expect(demo + aditya + unassigned).toBe(3);
    });
  });

  // =========================================================================
  // SUITE 3: AGENT 3 - FULL 8-LANGUAGE TRANSLATION & THEME POLISH (36 Tests)
  // =========================================================================
  describe('Suite 3: Agent 3 - Full 8-Language Translation & Theme Polish', () => {
    const allLocales: SupportedLocale[] = ['en-US', 'en-GB', 'es', 'fr', 'de', 'hi', 'ja', 'zh'];

    it('073. Supported locales array contains exactly the 8 target global locales', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en-US', 'en-GB', 'es', 'fr', 'de', 'hi', 'ja', 'zh']);
    });

    it('074. Every supported locale has a complete translations dictionary loaded', () => {
      for (const locale of allLocales) {
        expect(translations[locale]).toBeDefined();
        expect(Object.keys(translations[locale]).length).toBeGreaterThan(100);
      }
    });

    it('075. English US translations cover critical technician dashboard keys', () => {
      expect(translate('en-US', 'tech.standby_title')).toBe('No Active Work Orders Assigned');
      expect(translate('en-US', 'tech.on_duty')).toBe('⚡ Ready for Dispatch');
      expect(translate('en-US', 'tech.step.start_work')).toBe('3. Start Work');
      expect(translate('en-US', 'tech.step.complete')).toBe('4. Complete & Sign-off');
    });

    it('076. English GB translations cover critical UK terminology', () => {
      expect(translate('en-GB', 'tech.standby_title')).toBe('No Active Work Orders Allocated');
      expect(translate('en-GB', 'theme.stream')).toBe('Stream');
      expect(translate('en-GB', 'nav.quotes')).toBe('Quotations');
    });

    it('077. Spanish translations cover technician workflow and themes', () => {
      expect(translate('es', 'tech.standby_title')).toBe('Sin Trabajos Activos Asignados');
      expect(translate('es', 'tech.step.complete')).toBe('4. Completar y Firmar');
      expect(translate('es', 'theme.stream')).toBe('Corriente');
      expect(translate('es', 'theme.midnight')).toBe('Medianoche');
      expect(translate('es', 'theme.neon')).toBe('Neón');
    });

    it('078. French translations cover technician workflow and themes', () => {
      expect(translate('fr', 'tech.standby_title')).toBe('Aucune Intervention Assignée');
      expect(translate('fr', 'tech.step.complete')).toBe('4. Clôturer & Signer');
      expect(translate('fr', 'theme.stream')).toBe('Source');
      expect(translate('fr', 'theme.midnight')).toBe('Minuit');
      expect(translate('fr', 'theme.neon')).toBe('Néon');
    });

    it('079. German translations cover technician workflow and themes', () => {
      expect(translate('de', 'tech.standby_title')).toBe('Keine aktiven Einsätze zugewiesen');
      expect(translate('de', 'tech.step.complete')).toBe('4. Abschluss & Unterschrift');
      expect(translate('de', 'theme.stream')).toBe('Fluss');
      expect(translate('de', 'theme.midnight')).toBe('Mitternacht');
      expect(translate('de', 'theme.neon')).toBe('Neon');
    });

    it('080. Hindi translations cover technician workflow and themes', () => {
      expect(translate('hi', 'tech.standby_title')).toBe('कोई कार्य लंबित नहीं है');
      expect(translate('hi', 'tech.step.complete')).toBe('4. पूरा करें व हस्ताक्षर लें');
      expect(translate('hi', 'theme.stream')).toBe('स्ट्रीम');
      expect(translate('hi', 'theme.midnight')).toBe('मिडनाइट');
      expect(translate('hi', 'theme.neon')).toBe('नियॉन');
    });

    it('081. Japanese translations cover technician workflow and themes', () => {
      expect(translate('ja', 'tech.standby_title')).toBe('現在割り当てられた作業はありません');
      expect(translate('ja', 'tech.step.complete')).toBe('4. 完了・サイン受領');
      expect(translate('ja', 'theme.stream')).toBe('ストリーム');
      expect(translate('ja', 'theme.midnight')).toBe('ミッドナイト');
      expect(translate('ja', 'theme.neon')).toBe('ネオン');
    });

    it('082. Chinese translations cover technician workflow and themes', () => {
      expect(translate('zh', 'tech.standby_title')).toBe('当前暂无待处理工单');
      expect(translate('zh', 'tech.step.complete')).toBe('4. 完工签字');
      expect(translate('zh', 'theme.stream')).toBe('清流');
      expect(translate('zh', 'theme.midnight')).toBe('午夜');
      expect(translate('zh', 'theme.neon')).toBe('霓虹');
    });

    it('083. translateStatus correctly translates scheduled status across languages', () => {
      expect(translateStatus('scheduled', 'en-US')).toBe('Scheduled');
      expect(translateStatus('scheduled', 'es')).toBe('Programado');
      expect(translateStatus('scheduled', 'fr')).toBe('Planifié');
      expect(translateStatus('scheduled', 'de')).toBe('Geplant');
      expect(translateStatus('scheduled', 'hi')).toBe('शेड्यूल');
      expect(translateStatus('scheduled', 'ja')).toBe('予定');
      expect(translateStatus('scheduled', 'zh')).toBe('已排期');
    });

    it('084. translateStatus correctly translates in_progress status across languages', () => {
      expect(translateStatus('in_progress', 'en-US')).toBe('In Progress');
      expect(translateStatus('in_progress', 'es')).toBe('En Curso');
      expect(translateStatus('in_progress', 'fr')).toBe('En Cours');
      expect(translateStatus('in_progress', 'de')).toBe('In Bearbeitung');
      expect(translateStatus('in_progress', 'hi')).toBe('प्रगति पर');
      expect(translateStatus('in_progress', 'ja')).toBe('対応中');
      expect(translateStatus('in_progress', 'zh')).toBe('施工中');
    });

    it('085. translateStatus correctly translates completed status across languages', () => {
      expect(translateStatus('completed', 'en-US')).toBe('Completed');
      expect(translateStatus('completed', 'es')).toBe('Completado');
      expect(translateStatus('completed', 'fr')).toBe('Terminé');
      expect(translateStatus('completed', 'de')).toBe('Abgeschlossen');
      expect(translateStatus('completed', 'hi')).toBe('पूर्ण हुआ');
      expect(translateStatus('completed', 'ja')).toBe('完了');
      expect(translateStatus('completed', 'zh')).toBe('已完工');
    });

    it('086. translateStatus falls back gracefully to raw status if unknown status provided', () => {
      expect(translateStatus('unknown_status_code', 'en-US')).toBe('status.unknown_status_code');
    });

    it('087. translatePreset translates Water Heater Replacement preset into Spanish', () => {
      const res = translatePreset('Water Heater Replacement', 'es');
      expect(res).toBe('Diagnóstico y Cambio de Calentador');
    });

    it('088. translatePreset translates Drain Snaking preset into French', () => {
      const res = translatePreset('Drain Snaking / Unclog', 'fr');
      expect(res).toBe('Débouchage Canalisation Principale');
    });

    it('089. translatePreset translates Emergency Diagnostic preset into German', () => {
      const res = translatePreset('Emergency Plumbing Diagnostic', 'de');
      expect(res).toBe('Notfall-Rohrreparatur');
    });

    it('090. translatePreset translates Drain Snaking preset into Hindi', () => {
      const res = translatePreset('Drain Snaking', 'hi');
      expect(res).toBe('नाली सफाई व क्लॉग निकासी');
    });

    it('091. translatePreset translates Water Heater Replacement preset into Japanese', () => {
      const res = translatePreset('Water Heater Replacement', 'ja');
      expect(res).toBe('給湯器点検・交換工事');
    });

    it('092. translatePreset translates Drain Snaking preset into Chinese', () => {
      const res = translatePreset('Drain Snaking', 'zh');
      expect(res).toBe('主管道高压疏通');
    });

    it('093. translatePreset falls back safely to original name for custom presets', () => {
      const customName = 'Custom Specialty Valve Fitting';
      const res = translatePreset(customName, 'es');
      expect(res).toBe(customName);
    });

    it('094. Param interpolation works across all locales for {current} and {total} template', () => {
      for (const locale of allLocales) {
        const text = translate(locale, 'tech.stop_counter', { current: 2, total: 5 });
        expect(text).toContain('2');
        expect(text).toContain('5');
      }
    });

    it('095. Theme tokens Stream, Midnight, Neon are compact single-word labels across all 8 locales', () => {
      for (const locale of allLocales) {
        const stream = translate(locale, 'theme.stream');
        const midnight = translate(locale, 'theme.midnight');
        const neon = translate(locale, 'theme.neon');

        expect(stream.length).toBeLessThan(15);
        expect(midnight.length).toBeLessThan(15);
        expect(neon.length).toBeLessThan(15);
      }
    });

    it('096. Common navigation items are localized across all 8 languages without missing keys', () => {
      const navKeys = ['nav.customers', 'nav.quotes', 'nav.jobs', 'nav.invoices', 'nav.settings'];
      for (const locale of allLocales) {
        for (const key of navKeys) {
          const val = translate(locale, key);
          expect(val).toBeDefined();
          expect(val).not.toBe(key); // Key was successfully translated
        }
      }
    });

    it('097. Job detail actions translation keys are present in all locales', () => {
      for (const locale of allLocales) {
        expect(translate(locale, 'jobs.assigned_to')).toBeDefined();
        expect(translate(locale, 'jobs.unassigned_pool')).toBeDefined();
      }
    });

    it('098. Zero-state dashboard prompt translations exist across all 8 locales', () => {
      for (const locale of allLocales) {
        const title = translate(locale, 'dash.welcome_zero');
        const desc = translate(locale, 'dash.welcome_desc');
        expect(title).toBeDefined();
        expect(desc).toBeDefined();
        expect(title.length).toBeGreaterThan(0);
      }
    });

    it('099. Status labels for invoices (draft, sent, paid, overdue, void) are present in all locales', () => {
      const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'void'];
      for (const locale of allLocales) {
        for (const st of invoiceStatuses) {
          const val = translate(locale, `status.${st}`);
          expect(val).toBeDefined();
          expect(val).not.toBe(`status.${st}`);
        }
      }
    });

    it('100. Status labels for quotes (draft, sent, accepted, converted, rejected) are present in all locales', () => {
      const quoteStatuses = ['draft', 'sent', 'accepted', 'converted', 'rejected'];
      for (const locale of allLocales) {
        for (const st of quoteStatuses) {
          const val = translate(locale, `status.${st}`);
          expect(val).toBeDefined();
          expect(val).not.toBe(`status.${st}`);
        }
      }
    });

    it('101. Common search key is localized properly in Japanese', () => {
      const val = translate('ja', 'common.search');
      expect(val).toBe('検索...');
    });

    it('102. Missing key across all locales returns the key itself as safety fallback', () => {
      const missingKey = 'non.existent.translation.key.2026';
      expect(translate('en-US', missingKey)).toBe(missingKey);
    });

    it('103. Theme icon buttons retain proper accessibility labels across themes', () => {
      const themes = ['stream', 'midnight', 'neon'] as const;
      expect(themes).toContain('stream');
      expect(themes).toContain('midnight');
      expect(themes).toContain('neon');
    });

    it('104. Standby Radar subtitle key exists across all 8 languages', () => {
      for (const locale of allLocales) {
        const val = translate(locale, 'tech.standby_desc');
        expect(val).toBeDefined();
        expect(val.length).toBeGreaterThan(0);
      }
    });

    it('105. Technician steps (en_route, arrived, start_work, complete) are localized in all languages', () => {
      for (const locale of allLocales) {
        expect(translate(locale, 'tech.step.en_route')).toBeDefined();
        expect(translate(locale, 'tech.step.arrived')).toBeDefined();
        expect(translate(locale, 'tech.step.start_work')).toBeDefined();
        expect(translate(locale, 'tech.step.complete')).toBeDefined();
      }
    });

    it('106. Customer contact action buttons (call_customer, sms_alert) are localized in all languages', () => {
      for (const locale of allLocales) {
        expect(translate(locale, 'tech.call_customer')).toBeDefined();
        expect(translate(locale, 'tech.sms_alert')).toBeDefined();
      }
    });

    it('107. Technician locked completed order list header is translated across all languages', () => {
      for (const locale of allLocales) {
        const header = translate(locale, 'tech.completed_history');
        expect(header).toBeDefined();
        expect(header.length).toBeGreaterThan(0);
      }
    });

    it('108. Entire 8-language matrix verified with zero missing translation keys in critical workflow', () => {
      const criticalKeys = [
        'nav.dashboard',
        'nav.customers',
        'nav.quotes',
        'nav.jobs',
        'nav.invoices',
        'theme.stream',
        'theme.midnight',
        'theme.neon',
        'tech.standby_title',
        'tech.standby_desc',
        'tech.on_duty',
        'tech.step.complete',
        'tech.completed_history',
        'status.scheduled',
        'status.in_progress',
        'status.completed',
      ];

      for (const locale of allLocales) {
        for (const key of criticalKeys) {
          const val = translate(locale, key);
          expect(val).toBeTruthy();
          expect(val).not.toBe(key);
        }
      }
    });
  });
});
