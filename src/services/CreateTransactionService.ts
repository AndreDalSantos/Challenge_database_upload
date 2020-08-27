import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    if (!['income', 'outcome'].includes(type)) {
      throw new Error('Transaction type not valid.');
    }

    const { total } = await transactionRepository.getBalance();

    if (total < value && type === 'outcome') {
      throw new AppError('Balance not enough to this transaction.');
    }

    const categoriesRepository = getRepository(Category);

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    let categoryId = '';

    if (checkCategoryExists) {
      categoryId = await categoriesRepository.getId(checkCategoryExists);
    } else {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(newCategory);

      categoryId = await categoriesRepository.getId(newCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryId,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
