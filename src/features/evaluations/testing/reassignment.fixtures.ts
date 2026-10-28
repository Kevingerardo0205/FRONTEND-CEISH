/**
 * Fixtures de la pantalla de reasignación tomados del backend real (captura del 2026-10-18).
 * Solo para specs: ningún código de la aplicación importa este archivo.
 *
 * Donde la captura venía abreviada se indica qué campos son reales y cuáles son relleno.
 */

/**
 * GET /api/evaluations/protocol/119/active-assignments (200, capa única).
 * La asignación 6 (evaluatorId 39) es textual. De las asignaciones 7..10 solo están
 * confirmados assignmentId, evaluatorId y evaluatorProfile; el resto copia los valores
 * de la asignación 6 y los nombres salen del dashboard real.
 */
export const ACTIVE_ASSIGNMENTS_119_BODY = {
  data: {
    protocolId: 119,
    ceishCode: 'CEISH-ESPOCH-EI-007-2026',
    versionId: 2,
    versionNumber: 1,
    assignments: [
      {
        assignmentId: 6,
        evaluatorId: 39,
        evaluatorFullName: 'Ana Karina Albuja Landi',
        evaluatorProfile: 'METODOLOGICO',
        status: 'ASSIGNED',
        isAssignedForAnnex10: false,
        assignedAt: '2026-06-03T05:19:06.698Z',
        deadlineDate: '2026-06-23',
        submittedAt: null,
      },
      {
        assignmentId: 7,
        evaluatorId: 40,
        evaluatorFullName: 'Veronica Mercedes Cando Brito',
        evaluatorProfile: 'METODOLOGICO',
        status: 'ASSIGNED',
        isAssignedForAnnex10: false,
        assignedAt: '2026-06-03T05:19:06.698Z',
        deadlineDate: '2026-06-23',
        submittedAt: null,
      },
      {
        assignmentId: 8,
        evaluatorId: 41,
        evaluatorFullName: 'Gabriel Alejandro Tamayo Becerra',
        evaluatorProfile: 'JURIDICO',
        status: 'ASSIGNED',
        isAssignedForAnnex10: false,
        assignedAt: '2026-06-03T05:19:06.698Z',
        deadlineDate: '2026-06-23',
        submittedAt: null,
      },
      {
        assignmentId: 9,
        evaluatorId: 42,
        evaluatorFullName: 'Nelly Margarita Padilla Padilla',
        evaluatorProfile: 'SOCIEDAD_CIVIL',
        status: 'ASSIGNED',
        isAssignedForAnnex10: false,
        assignedAt: '2026-06-03T05:19:06.698Z',
        deadlineDate: '2026-06-23',
        submittedAt: null,
      },
      {
        assignmentId: 10,
        evaluatorId: 43,
        evaluatorFullName: 'Jaime David Camacho Castillo PhD',
        evaluatorProfile: 'SOCIEDAD_CIVIL',
        status: 'ASSIGNED',
        isAssignedForAnnex10: false,
        assignedAt: '2026-06-03T05:19:06.698Z',
        deadlineDate: '2026-06-23',
        submittedAt: null,
      },
    ],
  },
  statusCode: 200,
  message: 'Success',
};

/**
 * GET /api/evaluations/evaluators/dashboard (200, rol SECRETARIA), solo data.evaluators.
 * Reales: id, fullName (salvo 104, 103, 32, 2 y 8, cuyo nombre no se capturó), profiles
 * y currentLoad de 36, 38 y 41. Relleno: email de todos, currentLoad del resto y los ids
 * de perfil de 39 y 40 (se reutilizan los de 36 y 38).
 */
export const DASHBOARD_BODY = {
  data: {
    evaluators: [
      {
        id: 36,
        fullName: 'Rolando Teruel Ginés',
        email: 'evaluador36@relleno.test',
        profiles: [
          { id: 7, name: 'Ético' },
          { id: 9, name: 'Salud' },
        ],
        currentLoad: 3,
        completedThisMonth: 0,
      },
      {
        id: 38,
        fullName: 'Patricio David Ramos Padilla',
        email: 'evaluador38@relleno.test',
        profiles: [
          { id: 6, name: 'Metodológico' },
          { id: 9, name: 'Salud' },
        ],
        currentLoad: 4,
        completedThisMonth: 0,
      },
      {
        id: 39,
        fullName: 'Ana Karina Albuja Landi',
        email: 'evaluador39@relleno.test',
        profiles: [
          { id: 6, name: 'Metodológico' },
          { id: 7, name: 'Ético' },
        ],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 40,
        fullName: 'Veronica Mercedes Cando Brito',
        email: 'evaluador40@relleno.test',
        profiles: [
          { id: 6, name: 'Metodológico' },
          { id: 7, name: 'Ético' },
        ],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 41,
        fullName: 'Gabriel Alejandro Tamayo Becerra',
        email: 'evaluador41@relleno.test',
        profiles: [{ id: 8, name: 'Jurídico' }],
        currentLoad: 8,
        completedThisMonth: 0,
      },
      {
        id: 42,
        fullName: 'Nelly Margarita Padilla Padilla',
        email: 'evaluador42@relleno.test',
        profiles: [{ id: 10, name: 'Sociedad Civil' }],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 43,
        fullName: 'Jaime David Camacho Castillo PhD',
        email: 'evaluador43@relleno.test',
        profiles: [{ id: 10, name: 'Sociedad Civil' }],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 104,
        fullName: 'Evaluador 104 (nombre no capturado)',
        email: 'evaluador104@relleno.test',
        profiles: [],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 103,
        fullName: 'Evaluador 103 (nombre no capturado)',
        email: 'evaluador103@relleno.test',
        profiles: [],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 32,
        fullName: 'Evaluador 32 (nombre no capturado)',
        email: 'evaluador32@relleno.test',
        profiles: [],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 2,
        fullName: 'Evaluador 2 (nombre no capturado)',
        email: 'evaluador2@relleno.test',
        profiles: [],
        currentLoad: 0,
        completedThisMonth: 0,
      },
      {
        id: 8,
        fullName: 'Evaluador 8 (nombre no capturado)',
        email: 'evaluador8@relleno.test',
        profiles: [],
        currentLoad: 0,
        completedThisMonth: 0,
      },
    ],
    pendingProtocols: [],
  },
  statusCode: 200,
  message: 'Success',
};

/**
 * Cuerpos de error reales. timestamp y path venían abreviados ("...") en la captura
 * y se dejan así; el 404 y el 401 se reconstruyen con la misma forma que el 400.
 */
export const ERROR_400_BODY = {
  statusCode: 400,
  timestamp: '...',
  path: '...',
  error: {
    message: 'Validation failed (numeric string is expected)',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const ERROR_404_BODY = {
  statusCode: 404,
  timestamp: '...',
  path: '...',
  error: { message: 'El protocolo con ID 0 no existe.', error: 'Not Found', statusCode: 404 },
};

export const ERROR_401_BODY = {
  statusCode: 401,
  timestamp: '...',
  path: '...',
  error: { message: 'Unauthorized', statusCode: 401 },
};

/** Sintético: 400 de validación con message como arreglo (forma descrita, no capturada). */
export const ERROR_400_ARRAY_BODY = {
  statusCode: 400,
  timestamp: '...',
  path: '...',
  error: {
    message: [
      'replacementEvaluatorId must be a number',
      'reason must be one of the following values',
    ],
    error: 'Bad Request',
    statusCode: 400,
  },
};
