import { Skeleton } from '@/shared/ui/custom/Skeleton'

function CartHeaderSkeleton() {
	return (
		<div className="flex flex-col 768:gap-4 gap-3">
			<Skeleton className="mt-2 768:h-[48px] h-[38px] 768:w-[350px] w-[250px] " />
			<Skeleton className="h-6 w-24" />

			<div className="mb-6 flex items-center gap-3">
				<Skeleton className="h-[30px] w-[42px] rounded-1" />
				<Skeleton className="h-[30px] w-[350px]" />
			</div>

			<div className="flex 768:flex-row flex-col-reverse justify-between gap-10">
				<div className="flex items-center 1280:justify-between gap-4">
					<Skeleton className="h-[32px] w-[28px]" />
					<Skeleton className="h-6 w-24" />
				</div>
				<Skeleton className="h-[64px] 768:w-[270px] w-full rounded-full" />
			</div>
		</div>
	)
}

export function CartProductTileCardSkeleton() {
	return (
		<div className="grid 1280:h-[200px] 768:h-[224px] h-[340px] 768:grid-cols-[auto_1fr] grid-cols-1 gap-4 768:gap-y-0 rounded-2 bg-gray-50 1280:p-4 p-6">
			<div>
				<Skeleton className="768:h-full h-[112px] 768:w-[112px] w-[80px] rounded-2" />
			</div>

			<div className="768:my-auto grid 1280:grid-cols-[1fr_auto] items-center gap-4 1280:pe-4 768:pe-2">
				<div className="flex flex-col justify-between 1280:gap-3 gap-2 1280:pb-0 768:pb-2">
					<div className="flex flex-col 1280:gap-1 gap-2">
						<Skeleton className="h-6 w-[260px]" />
					</div>

					<div className="flex gap-2">
						<Skeleton className="h-4 w-[70px]" />
						<Skeleton className="h-4 w-[60px]" />
					</div>
				</div>

				<div className="flex 1280:min-w-[148px] items-center justify-between 1280:gap-8 gap-4">
					<div className="flex 768:flex-row flex-col 768:items-center 768:gap-5 gap-4 self-end">
						<Skeleton className="h-[44px] w-[130px] rounded-1" />
						<Skeleton className="h-8 768:w-6 w-[90px] rounded-1" />
					</div>

					<div className="flex min-w-[148px] flex-col items-end 1280:gap-1 gap-0.5 self-start 768:self-center 1280:ps-2">
						<Skeleton className="h-6 w-[60px]" />
					</div>
				</div>
			</div>
		</div>
	)
}

function CartSkeleton() {
	return (
		<div className="flex flex-col 1280:gap-11 768:gap-10 gap-3">
			<CartHeaderSkeleton />
			<div className="space-y-3">
				{[...Array(2)].map((_, idx) => (
					<CartProductTileCardSkeleton key={idx} />
				))}
			</div>
		</div>
	)
}

export default CartSkeleton
