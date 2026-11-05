import type { useT } from 'talkr'
import { z } from 'zod'
import {
	buildFirstNameSchema,
	buildLastNameSchema,
	buildLocationTypeSchema,
} from '@/shared/schemas/forms'
import { validatePhoneNumber } from '@/shared/schemas/utils/phoneValidation'
import {
	getHtmlErrorMessage,
	noHtmlValidation,
} from '@/shared/schemas/utils/validationUtils'

export const addressFormSchema = z.object({
	id: z.string().optional(),
	streetAndNumber: z.string(),
	city: z.string(),
	zipCode: z.string(),
	country: z.string(),
	countryIsoCode: z.string().optional(),
	appartmentSuiteFloor: z.string(),
	deliverToCompany: z.boolean().optional(),
	company: z.string().optional(),
	department: z.string().optional(),
	jobTitle: z.string().optional(),
	titleCode: z.string(),
	title: z.string().optional(),
	firstName: z.string(),
	lastName: z.string(),
	phoneNumber: z.string(),
	locationType: z.string(),
	defaultDeliveryAddress: z.boolean().optional().default(false),
	deliveryAddress: z.boolean().optional().default(true),
	// Forwarding to BE to dont overwrite existing values with empty values
	defaultBillingAddress: z.boolean().optional(),
	billingAddress: z.boolean().optional(),
	billingEmail: z.string().optional(),
	vatNumber: z.string().optional(),
})

export type DeliveryAddressFormValues = z.infer<typeof addressFormSchema>

export const ADDRESS_REGEX = /^[\p{L}\p{N}\p{M}\s\-'\.#,\/]{1,200}$/u
export const CITY_REGEX = /^[\p{L}\p{M}\s\-'\.]{1,250}$/u
export const ZIP_CODE_REGEX = /^[\p{L}\p{N}\s\-]{2,12}$/u
const APPARTMENT_SUITE_FLOOR_REGEX = /^[\p{L}\p{N}\p{M}\s\-'\.#\/]+$/u

export const addressFormSchemaWithErrors = (
	T: ReturnType<typeof useT>['T'],
	countryCode?: string,
) =>
	addressFormSchema
		.extend({
			streetAndNumber: addressFormSchema.shape.streetAndNumber
				.min(1, { message: T('form.streetAndNumber.error') })
				.regex(ADDRESS_REGEX, {
					message: T('form.streetAndNumber.errorInvalid'),
				})
				.refine((val) => val.trim().length > 0, {
					message: T('form.streetAndNumber.errorInvalid'),
				})
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) }),
			city: addressFormSchema.shape.city
				.min(1, { message: T('form.city.error') })
				.regex(CITY_REGEX, {
					message: T('form.city.errorInvalid'),
				})
				.refine((val) => val.trim().length > 0, {
					message: T('form.city.errorInvalid'),
				})
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) }),
			zipCode: addressFormSchema.shape.zipCode
				.min(2, { message: T('form.zipCode.error') })
				.regex(ZIP_CODE_REGEX, {
					message: T('form.zipCode.errorInvalid'),
				})
				.refine((val) => val.trim().length > 0, {
					message: T('form.zipCode.errorInvalid'),
				})
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) }),
			appartmentSuiteFloor: addressFormSchema.shape.appartmentSuiteFloor
				.refine((val) => !val || APPARTMENT_SUITE_FLOOR_REGEX.test(val), {
					message: T('form.appartmentSuiteFloor.errorInvalid'),
				})
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
				.optional(),
			company: addressFormSchema.shape.company
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
				.optional(),
			department: addressFormSchema.shape.department
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
				.optional(),
			jobTitle: addressFormSchema.shape.jobTitle
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
				.optional(),
			vatNumber: addressFormSchema.shape.vatNumber
				.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
				.optional(),
			firstName: buildFirstNameSchema({
				firstNameRequiredMessage: T('form.firstName.error'),
				firstNameInvalidMessage: T('form.firstName.errorInvalid'),
			}),
			lastName: buildLastNameSchema({
				lastNameRequiredMessage: T('form.lastName.error'),
				lastNameInvalidMessage: T('form.lastName.errorInvalid'),
			}),
			country: addressFormSchema.shape.country.min(1, {
				message: T('form.country.error'),
			}),
			titleCode: addressFormSchema.shape.titleCode.min(1, {
				message: T('form.titleCode.error'),
			}),
			phoneNumber: addressFormSchema.shape.phoneNumber.min(1, {
				message: T('form.phoneNumber.error.required'),
			}),
			locationType: buildLocationTypeSchema(),
		})
		.superRefine(async (data, ctx) => {
			if (data.deliverToCompany) {
				if (!data.company?.trim()) {
					ctx.addIssue({
						path: ['company'],
						code: z.ZodIssueCode.custom,
						message: T('form.companyName.error'),
					})
				}
				if (!data.department?.trim()) {
					ctx.addIssue({
						path: ['department'],
						code: z.ZodIssueCode.custom,
						message: T('form.department.error'),
					})
				}
			}
			if (data.phoneNumber) {
				const isValid = await validatePhoneNumber(data.phoneNumber, countryCode)
				if (!isValid) {
					ctx.addIssue({
						path: ['phoneNumber'],
						code: z.ZodIssueCode.custom,
						message: T('form.phoneNumber.error.invalid'),
					})
				}
			}
		})
