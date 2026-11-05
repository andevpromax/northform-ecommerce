export const PRODUCT_NUMBER_REGEX = /^[A-Za-z0-9]{1,20}$/
export const SKU_REGEX = /^[0-9A-Za-z]{8,10}$/
export const NAME_REGEX = /^[\p{L}\p{M}\s\-'\.]{1,100}$/u
export const COMPANY_NAME_REGEX = /^[\p{L}\p{N}\p{M}\s\-'\.&"\/\\(),]{1,250}$/u
export const ADDRESS_REGEX = /^[\p{L}\p{N}\p{M}\s\-'\.#,\/]{1,200}$/u
export const CITY_REGEX = /^[\p{L}\p{M}\s\-'\.]{1,250}$/u
export const ZIP_CODE_REGEX = /^[\p{L}\p{N}\s\-]{2,12}$/u
export const TEXTAREA_REGEX =
	/^(?!.*<[^>]*>)(?!.* {9,})(?!.*(\r?\n){4,})[\p{L}\p{N}\p{M}\p{P}\p{S}\s]{1,250}$/u

export const ONLY_SPACES_REGEX = /^\s+$/
export const REPEATED_CHARS_REGEX = /(.)\1{2,}/u

export const MM_YYYY_REGEX = /^(0[1-9]|1[0-2])-[0-9]{4}$/
export const DATE_NON_DIGIT_OR_DASH_REGEX = /[^\d-]/g
export const DATE_MONTH_YEAR_FORMAT_REGEX = /^(\d{2})(\d)/
export const DATE_FULL_FORMAT_REGEX = /(\d{2})-(\d{4}).*/
export const HTML_TAG_REGEX = /<[^>]+>/
