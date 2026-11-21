import fs from 'fs';

const file = 'apps/web/src/pages/admin/AdminRequestDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      await apiRequest(\`/admin/requests/\${request.id}/assign\`, {
        method: 'POST',
        body: JSON.stringify({
          professionalIds: selectedProIds,
          responseDeadline,
          internalNotes,
        }),
      }).catch(() => {});

      const updated = updatePlatformRequestStatus(request.id, 'ASSIGNED', {
        assignedCount: selectedProIds.length,
        assignedProfessionalIds: selectedProIds,
        responseDeadline,
        adminNotes: internalNotes,
      });`;

const replacement = `      const allAssignedTokens = new Set<string>();
      selectedProIds.forEach((proId) => {
        allAssignedTokens.add(proId);
        allAssignedTokens.add(proId.replace(/\\s+/g, ''));
        const matched = professionals.find((p) => p.id === proId || p.userId === proId);
        if (matched) {
          if (matched.id) {
            allAssignedTokens.add(matched.id);
            allAssignedTokens.add(matched.id.replace(/\\s+/g, ''));
          }
          if (matched.userId) allAssignedTokens.add(matched.userId);
          if (matched.phone) {
            const ph = matched.phone.replace(/\\D/g, '').slice(-10);
            if (ph) {
              allAssignedTokens.add(ph);
              allAssignedTokens.add(\`+91 \${ph}\`);
              allAssignedTokens.add(\`usr-arch-\${ph}\`);
              allAssignedTokens.add(\`pro-\${ph}\`);
            }
          }
        }
      });
      const expandedAssignedIds = Array.from(allAssignedTokens);

      await apiRequest(\`/admin/requests/\${request.id}/assign\`, {
        method: 'POST',
        body: JSON.stringify({
          professionalIds: expandedAssignedIds,
          responseDeadline,
          internalNotes,
        }),
      }).catch(() => {});

      const updated = updatePlatformRequestStatus(request.id, 'ASSIGNED', {
        assignedCount: selectedProIds.length,
        assignedProfessionalIds: expandedAssignedIds,
        responseDeadline,
        adminNotes: internalNotes,
      });`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const result = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(file, result, 'utf8');
  console.log('SUCCESS: AdminRequestDetail.tsx updated!');
} else {
  console.log('Target not found in normalized content!');
}
