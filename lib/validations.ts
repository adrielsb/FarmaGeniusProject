
import { z } from "zod"

export const emailSchema = z.string().email("Email inválido").min(1, "Email é obrigatório")

export const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo").trim(),
  email: emailSchema
})

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string()
    .min(8, "Nova senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Nova senha deve ter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Nova senha deve ter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Nova senha deve ter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Nova senha deve ter pelo menos um caractere especial"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
})

export const mappingSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo").trim(),
  description: z.string().max(200, "Descrição muito longa").optional(),
  mappingData: z.record(z.string()).refine(
    (data) => Object.keys(data).length > 0,
    "Mapeamento deve ter pelo menos uma entrada"
  )
})

export const userStatsSchema = z.object({
  totalReports: z.number().min(0),
  lastLogin: z.string().nullable(),
  accountCreated: z.string(),
  totalProcessingTime: z.number().min(0)
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>
export type MappingFormData = z.infer<typeof mappingSchema>
export type UserStats = z.infer<typeof userStatsSchema>
