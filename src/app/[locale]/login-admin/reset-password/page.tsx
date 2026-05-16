import ResetPasswordClient from "./ResetPasswordClient";

export default async function ResetPasswordPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const token = typeof params.token === 'string' ? params.token : "";

    return <ResetPasswordClient token={token} />;
}
