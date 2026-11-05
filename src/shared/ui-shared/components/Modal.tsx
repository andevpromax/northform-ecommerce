'use client'

import { useT } from 'talkr'

import {
	ModalContent as DesignSystemModalContent,
	Modal,
	ModalClose,
	type ModalContentProps,
	type ModalContentRef,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	ModalPortal,
	type ModalProps,
	ModalTitle,
	ModalTrigger,
} from '@/shared/ui/content/Modal'

export const ModalContent = ({
	children,
	TmodalClose,
	...props
}: ModalContentProps) => {
	const { T } = useT()
	const modalCloseLabel = TmodalClose ?? T('modal.close')

	return (
		<DesignSystemModalContent TmodalClose={modalCloseLabel} {...props}>
			{children}
		</DesignSystemModalContent>
	)
}

export {
	Modal,
	ModalClose,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	ModalPortal,
	ModalTitle,
	ModalTrigger,
}

export type { ModalProps, ModalContentProps, ModalContentRef }
