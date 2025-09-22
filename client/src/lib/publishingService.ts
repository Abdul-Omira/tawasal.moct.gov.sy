/**
 * Publishing Service - Form Publishing and Approval Workflow
 * Handles form publishing, approval system, and versioning
 */

import { Form, FormStatus } from '../types/form';

export interface PublishingWorkflow {
  id: string;
  formId: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  submittedBy: string;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  comments?: string;
  version: number;
  previousVersion?: string;
}

export interface ApprovalRequest {
  id: string;
  formId: string;
  formTitle: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  reviewedAt?: Date;
  comments?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  changes: string[];
}

export interface PublishingStats {
  totalForms: number;
  publishedForms: number;
  pendingApproval: number;
  draftForms: number;
  rejectedForms: number;
  averageApprovalTime: number; // in hours
  approvalRate: number; // percentage
}

export class PublishingService {
  private static instance: PublishingService;
  private workflows: Map<string, PublishingWorkflow> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private formVersions: Map<string, any[]> = new Map();

  private constructor() {
    this.initializeDefaultData();
  }

  public static getInstance(): PublishingService {
    if (!PublishingService.instance) {
      PublishingService.instance = new PublishingService();
    }
    return PublishingService.instance;
  }

  private initializeDefaultData(): void {
    // Initialize with some sample data
    const sampleWorkflow: PublishingWorkflow = {
      id: 'workflow_1',
      formId: 'form_1',
      status: 'published',
      submittedBy: 'user_1',
      submittedAt: new Date('2024-01-15'),
      reviewedBy: 'admin_1',
      reviewedAt: new Date('2024-01-16'),
      version: 1
    };
    this.workflows.set(sampleWorkflow.id, sampleWorkflow);
  }

  // Submit form for approval
  async submitForApproval(formId: string, submittedBy: string, changes: string[] = []): Promise<ApprovalRequest> {
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const approvalRequest: ApprovalRequest = {
      id: requestId,
      formId,
      formTitle: `Form ${formId}`, // This would be fetched from the form
      submittedBy,
      submittedAt: new Date(),
      status: 'pending',
      priority: 'medium',
      changes
    };

    this.approvalRequests.set(requestId, approvalRequest);

    // Create workflow entry
    const workflow: PublishingWorkflow = {
      id: `workflow_${requestId}`,
      formId,
      status: 'pending_approval',
      submittedBy,
      submittedAt: new Date(),
      version: this.getNextVersion(formId)
    };
    this.workflows.set(workflow.id, workflow);

    return approvalRequest;
  }

  // Approve form
  async approveForm(requestId: string, reviewer: string, comments?: string): Promise<boolean> {
    const request = this.approvalRequests.get(requestId);
    if (!request) return false;

    request.status = 'approved';
    request.reviewer = reviewer;
    request.reviewedAt = new Date();
    if (comments) request.comments = comments;

    // Update workflow
    const workflow = Array.from(this.workflows.values()).find(w => w.formId === request.formId);
    if (workflow) {
      workflow.status = 'approved';
      workflow.reviewedBy = reviewer;
      workflow.reviewedAt = new Date();
      if (comments) workflow.comments = comments;
    }

    return true;
  }

  // Reject form
  async rejectForm(requestId: string, reviewer: string, comments: string): Promise<boolean> {
    const request = this.approvalRequests.get(requestId);
    if (!request) return false;

    request.status = 'rejected';
    request.reviewer = reviewer;
    request.reviewedAt = new Date();
    request.comments = comments;

    // Update workflow
    const workflow = Array.from(this.workflows.values()).find(w => w.formId === request.formId);
    if (workflow) {
      workflow.status = 'rejected';
      workflow.reviewedBy = reviewer;
      workflow.reviewedAt = new Date();
      workflow.comments = comments;
    }

    return true;
  }

  // Publish form
  async publishForm(formId: string, publishedBy: string): Promise<boolean> {
    const workflow = Array.from(this.workflows.values()).find(w => w.formId === formId);
    if (!workflow || workflow.status !== 'approved') return false;

    workflow.status = 'published';
    workflow.reviewedBy = publishedBy;
    workflow.reviewedAt = new Date();

    // Update form status
    // This would typically update the form in the database
    return true;
  }

  // Get approval requests
  async getApprovalRequests(filters: {
    status?: 'pending' | 'approved' | 'rejected';
    reviewer?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  } = {}): Promise<ApprovalRequest[]> {
    let requests = Array.from(this.approvalRequests.values());

    if (filters.status) {
      requests = requests.filter(r => r.status === filters.status);
    }
    if (filters.reviewer) {
      requests = requests.filter(r => r.reviewer === filters.reviewer);
    }
    if (filters.priority) {
      requests = requests.filter(r => r.priority === filters.priority);
    }

    return requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Get workflow history for a form
  async getFormWorkflow(formId: string): Promise<PublishingWorkflow[]> {
    return Array.from(this.workflows.values())
      .filter(w => w.formId === formId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Get publishing statistics
  async getPublishingStats(): Promise<PublishingStats> {
    const workflows = Array.from(this.workflows.values());
    const requests = Array.from(this.approvalRequests.values());

    const totalForms = workflows.length;
    const publishedForms = workflows.filter(w => w.status === 'published').length;
    const pendingApproval = requests.filter(r => r.status === 'pending').length;
    const draftForms = workflows.filter(w => w.status === 'draft').length;
    const rejectedForms = workflows.filter(w => w.status === 'rejected').length;

    // Calculate average approval time
    const approvedRequests = requests.filter(r => r.status === 'approved' && r.reviewedAt);
    const totalApprovalTime = approvedRequests.reduce((total, request) => {
      if (request.reviewedAt) {
        return total + (request.reviewedAt.getTime() - request.submittedAt.getTime());
      }
      return total;
    }, 0);
    const averageApprovalTime = approvedRequests.length > 0 
      ? totalApprovalTime / approvedRequests.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate approval rate
    const totalReviewed = requests.filter(r => r.status === 'approved' || r.status === 'rejected').length;
    const approvalRate = totalReviewed > 0 ? (approvedRequests.length / totalReviewed) * 100 : 0;

    return {
      totalForms,
      publishedForms,
      pendingApproval,
      draftForms,
      rejectedForms,
      averageApprovalTime,
      approvalRate
    };
  }

  // Create form version
  async createFormVersion(formId: string, formData: any, createdBy: string): Promise<string> {
    const versionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.formVersions.has(formId)) {
      this.formVersions.set(formId, []);
    }

    const versions = this.formVersions.get(formId)!;
    const version = {
      id: versionId,
      formId,
      formData,
      createdBy,
      createdAt: new Date(),
      version: versions.length + 1
    };

    versions.push(version);
    return versionId;
  }

  // Get form versions
  async getFormVersions(formId: string): Promise<any[]> {
    return this.formVersions.get(formId) || [];
  }

  // Restore form version
  async restoreFormVersion(formId: string, versionId: string): Promise<boolean> {
    const versions = this.formVersions.get(formId);
    if (!versions) return false;

    const version = versions.find(v => v.id === versionId);
    if (!version) return false;

    // This would typically restore the form data
    return true;
  }

  // Get next version number for a form
  private getNextVersion(formId: string): number {
    const versions = this.formVersions.get(formId) || [];
    return versions.length + 1;
  }

  // Get forms by status
  async getFormsByStatus(status: FormStatus): Promise<Form[]> {
    // This would typically fetch from the database
    return [];
  }

  // Update form status
  async updateFormStatus(formId: string, status: FormStatus, updatedBy: string): Promise<boolean> {
    // This would typically update the form in the database
    return true;
  }

  // Get publishing queue
  async getPublishingQueue(): Promise<ApprovalRequest[]> {
    return this.getApprovalRequests({ status: 'pending' });
  }

  // Get my submissions
  async getMySubmissions(userId: string): Promise<ApprovalRequest[]> {
    return Array.from(this.approvalRequests.values())
      .filter(r => r.submittedBy === userId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Get my reviews
  async getMyReviews(userId: string): Promise<ApprovalRequest[]> {
    return Array.from(this.approvalRequests.values())
      .filter(r => r.reviewer === userId)
      .sort((a, b) => (b.reviewedAt || b.submittedAt).getTime() - (a.reviewedAt || a.submittedAt).getTime());
  }
}

// Export singleton instance
export const publishingService = PublishingService.getInstance();
