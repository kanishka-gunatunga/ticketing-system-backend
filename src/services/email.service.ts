export const emailService = {
    sendTicketConfirmation: async (email: string, ticketNumber: string, customerName: string): Promise<void> => {
        console.log(`[Email Service Mock] Sending ticket confirmation to ${email} (${customerName}) for Ticket #${ticketNumber}`);
        return Promise.resolve();
    }
};
