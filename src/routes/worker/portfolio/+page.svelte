<script lang="ts">
  import { onMount } from 'svelte';
  import { portfolioApi } from '$lib/api/portfolio';
  import { filesApi } from '$lib/api/files';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import type {
    PortfolioSummaryResponse,
    IdentityDocumentResponse,
    IdentityDocumentType,
    PortfolioImageResponse,
    CertificateResponse
  } from '$lib/types/api';
  import {
    Camera,
    Plus,
    Trash2,
    Award,
    ShieldCheck,
    FileCheck,
    Image,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye
  } from 'lucide-svelte';

  let portfolio = $state<PortfolioSummaryResponse | null>(null);
  let identityDocs = $state<IdentityDocumentResponse[]>([]);
  let loading = $state(true);

  // Profile Photo State
  let avatarFileInput = $state<HTMLInputElement>();
  let uploadingAvatar = $state(false);

  // Add Image Modal State
  let imageModalOpen = $state(false);
  let imageFileInput = $state<HTMLInputElement>();
  let imageTitle = $state('');
  let imageDescription = $state('');
  let imageFile = $state<File | null>(null);
  let uploadingImage = $state(false);

  // Add Certificate Modal State
  let certModalOpen = $state(false);
  let certFileInput = $state<HTMLInputElement>();
  let certName = $state('');
  let certIssuer = $state('');
  let certIssueDate = $state('');
  let certExpiryDate = $state('');
  let certFile = $state<File | null>(null);
  let uploadingCert = $state(false);

  // Add Identity Document Modal State
  let kycModalOpen = $state(false);
  let kycFileInput = $state<HTMLInputElement>();
  let kycDocType = $state<IdentityDocumentType>('AADHAAR');
  let kycDocNumber = $state('');
  let kycFile = $state<File | null>(null);
  let uploadingKyc = $state(false);

  async function loadPortfolioData() {
    loading = true;
    try {
      const [p, docs] = await Promise.all([
        portfolioApi.getMyPortfolio(),
        portfolioApi.getIdentityDocuments().catch(() => [])
      ]);
      portfolio = p;
      identityDocs = docs || [];
    } catch {
      toastStore.error('Could not load portfolio data.', 'Error');
    } finally {
      loading = false;
    }
  }

  onMount(loadPortfolioData);

  async function handleAvatarSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    uploadingAvatar = true;
    try {
      const stored = await filesApi.upload(file, 'PROFILE_PHOTO', 'WORKER');
      const updated = await portfolioApi.setProfilePhoto({ fileId: stored.id });
      if (portfolio) {
        portfolio.profilePhotoUrl = updated.profilePhotoUrl;
        portfolio.profileCompletionPercentage = updated.profileCompletionPercentage;
      }
      toastStore.success('Profile avatar updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      } else {
        toastStore.error('Could not update profile photo');
      }
    } finally {
      uploadingAvatar = false;
    }
  }

  async function handleAddImage(e: SubmitEvent) {
    e.preventDefault();
    if (!imageFile) {
      toastStore.warning('Please select an image file to upload.');
      return;
    }

    uploadingImage = true;
    try {
      const stored = await filesApi.upload(imageFile, 'PORTFOLIO_IMAGE', 'PORTFOLIO');
      const newImg = await portfolioApi.addImage({
        fileId: stored.id,
        title: imageTitle.trim() || null,
        description: imageDescription.trim() || null,
        displayOrder: (portfolio?.images?.length || 0) + 1
      });

      if (portfolio) {
        portfolio.images = [...portfolio.images, newImg];
      }
      imageModalOpen = false;
      imageTitle = '';
      imageDescription = '';
      imageFile = null;
      toastStore.success('Work sample added to your portfolio');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      } else {
        toastStore.error('Failed to add portfolio image');
      }
    } finally {
      uploadingImage = false;
    }
  }

  async function handleDeleteImage(id: string) {
    if (!confirm('Remove this image from your portfolio?')) return;
    try {
      await portfolioApi.deleteImage(id);
      if (portfolio) {
        portfolio.images = portfolio.images.filter((img) => img.id !== id);
      }
      toastStore.success('Image removed from portfolio');
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message);
    }
  }

  async function handleAddCertificate(e: SubmitEvent) {
    e.preventDefault();
    if (!certFile) {
      toastStore.warning('Please select certificate scan/document file.');
      return;
    }
    if (!certName.trim() || !certIssuer.trim()) {
      toastStore.warning('Certificate title and issuing organization are required.');
      return;
    }

    uploadingCert = true;
    try {
      const stored = await filesApi.upload(certFile, 'CERTIFICATE', 'CERTIFICATE');
      const newCert = await portfolioApi.addCertificate({
        fileId: stored.id,
        certificateName: certName.trim(),
        issuingOrganization: certIssuer.trim(),
        issueDate: certIssueDate || null,
        expiryDate: certExpiryDate || null
      });

      if (portfolio) {
        portfolio.certificates = [...portfolio.certificates, newCert];
      }
      certModalOpen = false;
      certName = '';
      certIssuer = '';
      certIssueDate = '';
      certExpiryDate = '';
      certFile = null;
      toastStore.success('Certificate added to portfolio for administrator verification');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      } else {
        toastStore.error('Failed to add certificate');
      }
    } finally {
      uploadingCert = false;
    }
  }

  async function handleDeleteCertificate(id: string) {
    if (!confirm('Remove this certificate?')) return;
    try {
      await portfolioApi.deleteCertificate(id);
      if (portfolio) {
        portfolio.certificates = portfolio.certificates.filter((c) => c.id !== id);
      }
      toastStore.success('Certificate removed');
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message);
    }
  }

  async function handleAddIdentityDocument(e: SubmitEvent) {
    e.preventDefault();
    if (!kycFile) {
      toastStore.warning('Please select identity document file/photo.');
      return;
    }
    if (!kycDocNumber.trim()) {
      toastStore.warning('Document number is required.');
      return;
    }

    uploadingKyc = true;
    try {
      const stored = await filesApi.upload(kycFile, 'IDENTITY_DOC', 'IDENTITY_DOC');
      const doc = await portfolioApi.addIdentityDocument({
        fileId: stored.id,
        documentType: kycDocType,
        documentNumber: kycDocNumber.trim()
      });

      identityDocs = [...identityDocs, doc];
      kycModalOpen = false;
      kycDocNumber = '';
      kycFile = null;
      toastStore.success('KYC Document submitted for compliance verification');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      } else {
        toastStore.error('Failed to submit identity document');
      }
    } finally {
      uploadingKyc = false;
    }
  }

  async function handleDeleteIdentityDoc(id: string) {
    if (!confirm('Remove this identity document?')) return;
    try {
      await portfolioApi.deleteIdentityDocument(id);
      identityDocs = identityDocs.filter((d) => d.id !== id);
      toastStore.success('Identity document removed from verification queue');
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message);
    }
  }
</script>

<svelte:head>
  <title>Portfolio & KYC Verification — BlueCollar</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Header -->
  <div class="border-b border-slate-200 dark:border-slate-800 pb-6">
    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      Portfolio & KYC Credentials
    </h1>
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
      Showcase proof of craftsmanship, trade licenses, and government identification to unlock verified customer badges
    </p>
  </div>

  {#if loading}
    <div class="space-y-6">
      <Skeleton class="h-44 rounded-2xl" />
      <Skeleton class="h-72 rounded-2xl" />
    </div>
  {:else if portfolio}
    <!-- Profile Photo & Completion Banner -->
    <Card class="p-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-5">
          <div class="relative group">
            <div class="w-20 h-20 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 font-bold text-2xl flex items-center justify-center border-2 border-amber-200 dark:border-amber-800 overflow-hidden shadow-xs">
              {#if portfolio.profilePhotoUrl}
                <img src={portfolio.profilePhotoUrl} alt="Worker Avatar" class="w-full h-full object-cover" />
              {:else}
                <Award class="w-10 h-10" />
              {/if}
            </div>

            <button
              type="button"
              onclick={() => avatarFileInput?.click()}
              disabled={uploadingAvatar}
              class="absolute inset-0 rounded-2xl bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Upload profile photo"
            >
              <Camera class="w-5 h-5" />
            </button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              bind:this={avatarFileInput}
              onchange={handleAvatarSelected}
              class="hidden"
            />
          </div>

          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Professional Profile Photo</h2>
            <p class="text-xs text-slate-500">Hover and click camera icon to update your public photo</p>
          </div>
        </div>

        <!-- Completion Indicator -->
        <div class="w-full sm:w-64 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 font-semibold">Profile Strength</span>
            <span class="font-extrabold text-amber-600">{portfolio.profileCompletionPercentage}%</span>
          </div>
          <div class="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div class="h-full bg-amber-500 rounded-full" style="width: {portfolio.profileCompletionPercentage}%"></div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Work Gallery Section -->
    <Card
      title="Past Work & Project Gallery"
      subtitle="Upload photos of jobs, installations, or completed trade work"
    >
      {#snippet header()}
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">Work Gallery Photos</h3>
            <p class="text-xs text-slate-500">Display completed craftsmanship to potential clients</p>
          </div>
          <Button variant="outline" size="sm" onclick={() => (imageModalOpen = true)}>
            <Plus class="w-4 h-4 mr-1.5" />
            Add Photo
          </Button>
        </div>
      {/snippet}

      {#if portfolio.images.length === 0}
        <div class="py-12 text-center text-xs text-slate-500">
          <Image class="w-8 h-8 text-slate-400 mx-auto mb-2" />
          No work samples uploaded yet. Add photos to get higher customer bookings!
        </div>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {#each portfolio.images as img (img.id)}
            <div class="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={img.imageUrl} alt={img.title || 'Work sample'} class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                <span class="text-xs font-semibold truncate">{img.title || 'Work Sample'}</span>
                <button
                  type="button"
                  onclick={() => handleDeleteImage(img.id)}
                  class="self-end p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                  aria-label="Delete work sample"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <!-- Trade Certifications Section -->
    <Card
      title="Trade Certifications & Licenses"
      subtitle="Accredited diplomas, ITI certificates, or safety licenses"
    >
      {#snippet header()}
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">Trade Licenses & Certifications</h3>
            <p class="text-xs text-slate-500">Certificates verified by administrators receive a verification badge</p>
          </div>
          <Button variant="outline" size="sm" onclick={() => (certModalOpen = true)}>
            <Plus class="w-4 h-4 mr-1.5" />
            Add Certificate
          </Button>
        </div>
      {/snippet}

      {#if portfolio.certificates.length === 0}
        <div class="py-12 text-center text-xs text-slate-500">
          <Award class="w-8 h-8 text-slate-400 mx-auto mb-2" />
          No trade certificates uploaded yet.
        </div>
      {:else}
        <div class="space-y-3">
          {#each portfolio.certificates as cert (cert.id)}
            <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award class="w-4 h-4" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {cert.certificateName}
                    </span>
                    {#if cert.verified}
                      <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 class="w-3 h-3 text-emerald-500" /> Verified
                      </span>
                    {:else}
                      <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock class="w-3 h-3 text-amber-500" /> Pending Admin Review
                      </span>
                    {/if}
                  </div>
                  <p class="text-slate-500 mt-0.5">
                    Issued by <span class="font-semibold text-slate-700 dark:text-slate-300">{cert.issuingOrganization}</span>
                    {#if cert.issueDate}
                      • Issued {cert.issueDate}
                    {/if}
                    {#if cert.expiryDate}
                      • Expires {cert.expiryDate}
                    {/if}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onclick={() => handleDeleteCertificate(cert.id)}
                class="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                aria-label="Remove certificate"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <!-- KYC Government Identity Documents Section -->
    <Card
      title="KYC Government Identity Documents"
      subtitle="Identity verification complies with safety regulations and unlocks the public verified checkmark"
    >
      {#snippet header()}
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">KYC Identity Documents</h3>
            <p class="text-xs text-slate-500">Aadhaar, PAN, Passport, Voter ID, or Driving License</p>
          </div>
          <Button variant="outline" size="sm" onclick={() => (kycModalOpen = true)}>
            <Plus class="w-4 h-4 mr-1.5" />
            Submit KYC Doc
          </Button>
        </div>
      {/snippet}

      {#if identityDocs.length === 0}
        <div class="py-12 text-center text-xs text-slate-500">
          <ShieldCheck class="w-8 h-8 text-slate-400 mx-auto mb-2" />
          No KYC identity documents submitted. Submit an ID to become a verified worker.
        </div>
      {:else}
        <div class="space-y-3">
          {#each identityDocs as doc (doc.id)}
            <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileCheck class="w-4 h-4" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {doc.documentType}
                    </span>

                    {#if doc.verificationStatus === 'VERIFIED'}
                      <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 class="w-3 h-3 text-emerald-500" /> Verified
                      </span>
                    {:else if doc.verificationStatus === 'REJECTED'}
                      <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertCircle class="w-3 h-3 text-rose-500" /> Rejected
                      </span>
                    {:else}
                      <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock class="w-3 h-3 text-amber-500" /> Verification Pending
                      </span>
                    {/if}
                  </div>

                  <p class="text-slate-500 mt-0.5">
                    Doc Number: ••••••••{doc.documentNumber.slice(-4)}
                    {#if doc.rejectionReason}
                      <span class="text-rose-600 block mt-1">Reason: {doc.rejectionReason}</span>
                    {/if}
                  </p>
                </div>
              </div>

              {#if doc.verificationStatus !== 'VERIFIED'}
                <button
                  type="button"
                  onclick={() => handleDeleteIdentityDoc(doc.id)}
                  class="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  aria-label="Remove unverified identity document"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  {/if}
</div>

<!-- Add Image Modal -->
{#if imageModalOpen}
  <Modal open={true} onclose={() => (imageModalOpen = false)} title="Add Work Sample Photo" size="md">
    <form onsubmit={handleAddImage} class="space-y-4">
      <div>
        <label for="img-file" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Select Photo File
        </label>
        <input
          id="img-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onchange={(e) => {
            const t = e.target as HTMLInputElement;
            imageFile = t.files?.[0] || null;
          }}
          required
          class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>

      <Input label="Title (Optional)" placeholder="e.g. Bathroom tile fitting, 3BHK electrical wiring" bind:value={imageTitle} />
      <Input label="Description (Optional)" placeholder="Materials used, client specs, or tools..." bind:value={imageDescription} />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (imageModalOpen = false)}>Cancel</Button>
        <Button variant="primary" type="submit" loading={uploadingImage}>Upload Image</Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Add Certificate Modal -->
{#if certModalOpen}
  <Modal open={true} onclose={() => (certModalOpen = false)} title="Add Trade Certificate" size="md">
    <form onsubmit={handleAddCertificate} class="space-y-4">
      <div>
        <label for="cert-file" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Certificate Document / Photo
        </label>
        <input
          id="cert-file"
          type="file"
          accept="image/*,application/pdf"
          onchange={(e) => {
            const t = e.target as HTMLInputElement;
            certFile = t.files?.[0] || null;
          }}
          required
          class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>

      <Input label="Certificate Title" placeholder="e.g. National Trade Certificate - Electrician" bind:value={certName} required />
      <Input label="Issuing Organization" placeholder="e.g. National Council for Vocational Training" bind:value={certIssuer} required />

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="cert-issue" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Issue Date</label>
          <input
            id="cert-issue"
            type="date"
            bind:value={certIssueDate}
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label for="cert-expiry" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Expiry Date (Optional)</label>
          <input
            id="cert-expiry"
            type="date"
            bind:value={certExpiryDate}
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (certModalOpen = false)}>Cancel</Button>
        <Button variant="primary" type="submit" loading={uploadingCert}>Submit Certificate</Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Add KYC Modal -->
{#if kycModalOpen}
  <Modal open={true} onclose={() => (kycModalOpen = false)} title="Submit KYC Government Identity Document" size="md">
    <form onsubmit={handleAddIdentityDocument} class="space-y-4">
      <Select
        label="Document Type"
        bind:value={kycDocType}
        options={[
          { value: 'AADHAAR', label: 'Aadhaar Card' },
          { value: 'PAN', label: 'PAN Card' },
          { value: 'VOTER_ID', label: 'Voter ID' },
          { value: 'PASSPORT', label: 'Passport' },
          { value: 'DRIVING_LICENSE', label: 'Driving License' }
        ]}
        required
      />

      <Input
        label="Document Number"
        placeholder="Enter document identification number"
        bind:value={kycDocNumber}
        required
      />

      <div>
        <label for="kyc-file" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Identity Document Image / Scan
        </label>
        <input
          id="kyc-file"
          type="file"
          accept="image/*,application/pdf"
          onchange={(e) => {
            const t = e.target as HTMLInputElement;
            kycFile = t.files?.[0] || null;
          }}
          required
          class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (kycModalOpen = false)}>Cancel</Button>
        <Button variant="primary" type="submit" loading={uploadingKyc}>Submit Document</Button>
      </div>
    </form>
  </Modal>
{/if}
